import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import {
  CodiceParser,
  ParsedLicitacion,
} from '../shared/parsers/codice.parser';
import { Licitacion } from '../shared/entities/licitacion.entity';
import { OrganoContratacion } from '../shared/entities/organo-contratacion.entity';
import { ScrapingLog } from '../shared/entities/scraping-log.entity';
import { AlertsService } from '../../alerts/alerts.service';
import * as https from 'https';

@Injectable()
export class PlaceScraperService {
  private readonly logger = new Logger(PlaceScraperService.name);
  private readonly FEED_URL =
    'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';

  constructor(
    @InjectRepository(Licitacion)
    private readonly licRepo: Repository<Licitacion>,
    @InjectRepository(OrganoContratacion)
    private readonly orgRepo: Repository<OrganoContratacion>,
    @InjectRepository(ScrapingLog)
    private readonly logRepo: Repository<ScrapingLog>,
    private readonly http: HttpService,
    private readonly parser: CodiceParser,
    private readonly dataSource: DataSource,
    private readonly alertsService: AlertsService,
  ) {}

  async scrapeCurrentFeed(maxPages = 5) {
    const start = new Date();
    let newItems = 0,
      updatedItems = 0,
      errors = 0;

    let url: string | null = this.FEED_URL;
    let page = 0;

    while (url && page < maxPages) {
      page++;
      this.logger.log(`[PLACE] Pág ${page}: ${url}`);
      try {
        const response = await this.http.axiosRef.get<string>(url, {
          headers: { Accept: 'application/atom+xml' },
          responseType: 'text',
          timeout: 30000,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        });
        const data = response.data;

        const { entries, nextUrl } = this.parser.parseAtomFeed(data);
        this.logger.log(`[PLACE] Pág ${page}: ${entries.length} entries`);

        for (const entry of entries) {
          try {
            const result = await this.upsertWithTransaction(entry);
            if (result.status === 'new') newItems++;
            else if (result.status === 'updated') updatedItems++;
            
            // Disparar alertas para licitaciones nuevas o actualizadas
            if ((result.status === 'new' || result.status === 'updated') && result.licitacion) {
              try {
                await this.alertsService.triggerAlertsForLicitacion(result.licitacion);
              } catch (alertError) {
                const msg = alertError instanceof Error ? alertError.message : 'Unknown error';
                this.logger.warn(`[PLACE] Error disparando alertas para ${result.licitacion.id}: ${msg}`);
                // No interrumpir el scraping si fallan las alertas
              }
            }
          } catch (e) {
            errors++;
            if (errors <= 5) {
              const msg = e instanceof Error ? e.message : 'Unknown error';
              this.logger.warn(`[PLACE] Error upsert: ${msg}`);
            }
          }
        }
        url = nextUrl;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        this.logger.error(`[PLACE] Error descarga: ${msg}`);
        errors++;
        break;
      }
    }

    await this.logRepo.save({
      source: 'PLACE',
      status: errors > 0 ? 'PARTIAL' : 'SUCCESS',
      itemsNew: newItems,
      itemsUpdated: updatedItems,
      itemsErrors: errors,
      duration: Date.now() - start.getTime(),
      startedAt: start,
      finishedAt: new Date(),
    });

    this.logger.log(
      `[PLACE] Done: ${newItems} new, ${updatedItems} updated, ${errors} errors`
    );
    return { newItems, updatedItems, errors };
  }

  private async upsertWithTransaction(
    parsed: ParsedLicitacion
  ): Promise<{ status: 'new' | 'updated' | 'skipped'; licitacion: Licitacion }> {
    // PASO 1: Órgano (con retry independiente)
    let organoId: string | null = null;
    if (parsed.organoExternalId) {
      try {
        organoId = await this.upsertOrganoWithRetry(
          parsed,
          3 // reintentos
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `[PLACE] No se pudo crear Órgano: ${msg}. Continuando sin órgano.`
        );
        organoId = null;
      }
    }

    // PASO 2: Licitación (transacción separada)
    const result = await this.upsertLicitacionWithTransaction(parsed, organoId);
    return {
      status: result.status,
      licitacion: result.licitacion,
    };
  }

   private async upsertOrganoWithRetry(
    p: ParsedLicitacion,
    maxRetries: number,
  ): Promise<string | null> {
    if (!p.organoExternalId) return null;
 
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');
 
        try {
          const orgRepoTx = queryRunner.manager.getRepository(OrganoContratacion);
          const existing = await orgRepoTx.findOneBy({
            externalId: p.organoExternalId,
          });
 
          let orgId: string;
 
          if (existing) {
            const updates: Partial<OrganoContratacion> = {};
            if (
              p.organoNombre &&
              (!existing.nombre || existing.nombre === 'Desconocido')
            ) {
              updates.nombre = p.organoNombre;
            }
            if (p.organoTipo && !existing.tipo) updates.tipo = p.organoTipo;
            if (p.ccaa && !existing.ccaa) updates.ccaa = p.ccaa;
            if (p.provincia && !existing.provincia) updates.provincia = p.provincia;
 
            if (Object.keys(updates).length > 0) {
              await orgRepoTx.update(existing.id, updates);
            }
            orgId = existing.id;
          } else {
            const nuevo = orgRepoTx.create();
            nuevo.externalId = p.organoExternalId;
            nuevo.nombre = p.organoNombre || 'Desconocido';
            nuevo.tipo = p.organoTipo;
            nuevo.ccaa = p.ccaa;
            nuevo.provincia = p.provincia;
            nuevo.plataforma = 'PLACE';
            const saved = await orgRepoTx.save(nuevo);
            orgId = saved.id;
            this.logger.debug(`[PLACE] Órgano creado: ${saved.nombre} (${saved.id})`);
          }
 
          await queryRunner.commitTransaction();
          return orgId;
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 100;
          this.logger.warn(
            `[PLACE] Reintento Órgano ${attempt}/${maxRetries} en ${delay}ms. Error: ${lastError.message}`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
 
    throw lastError || new Error('Upsert Órgano falló después de reintentos');
  }

  private async upsertLicitacionWithTransaction(
    parsed: ParsedLicitacion,
    organoId: string | null
  ): Promise<{ status: 'new' | 'updated' | 'skipped'; licitacion: Licitacion }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const result = await this.upsertLicitacion(
        parsed,
        organoId,
        queryRunner.manager
      );
      await queryRunner.commitTransaction();
      return {
        status: result.status,
        licitacion: result.licitacion,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async upsertLicitacion(
    parsed: ParsedLicitacion,
    organoId: string | null,
    manager: EntityManager
  ): Promise<{ status: 'new' | 'updated' | 'skipped'; licitacion: Licitacion }> {
    const licRepoTx = manager.getRepository(Licitacion);

    const existing = await licRepoTx.findOneBy({
      externalId: parsed.externalId,
      source: parsed.source,
    });

    if (existing) {
      await licRepoTx.update(existing.id, {
        title: parsed.title,
        description: parsed.description,
        estado: parsed.estado,
        presupuestoBase: parsed.presupuestoBase,
        presupuestoConIva: parsed.presupuestoConIva,
        fechaPresentacion: parsed.fechaPresentacion,
        fechaAdjudicacion: parsed.fechaAdjudicacion,
        adjudicatarioNombre:
          parsed.adjudicatarioNombre || existing.adjudicatarioNombre,
        adjudicatarioNif: parsed.adjudicatarioNif || existing.adjudicatarioNif,
        importeAdjudicacion:
          parsed.importeAdjudicacion || existing.importeAdjudicacion,
        porcentajeBaja: parsed.porcentajeBaja ?? existing.porcentajeBaja,
        numLicitadores: parsed.numLicitadores ?? existing.numLicitadores,
        documentos:
          parsed.documentos.length > 0
            ? parsed.documentos
            : existing.documentos,
        organoId: organoId || existing.organoId,
      });
      
      // Recargar la licitación actualizada
      const updated = await licRepoTx.findOneBy({
        externalId: parsed.externalId,
        source: parsed.source,
      });
      
      return {
        status: 'updated',
        licitacion: updated!,
      };
    }

    const nueva = licRepoTx.create();
    nueva.externalId = parsed.externalId;
    nueva.source = parsed.source;
    nueva.title = parsed.title;
    nueva.description = parsed.description;
    nueva.cpvCodes = parsed.cpvCodes;
    nueva.presupuestoBase = parsed.presupuestoBase;
    nueva.presupuestoConIva = parsed.presupuestoConIva;
    nueva.tipoContrato = parsed.tipoContrato;
    nueva.procedimiento = parsed.procedimiento;
    nueva.estado = parsed.estado;
    nueva.tramitacion = parsed.tramitacion;
    nueva.ccaa = parsed.ccaa;
    nueva.provincia = parsed.provincia;
    nueva.municipio = parsed.municipio;
    nueva.fechaPublicacion = parsed.fechaPublicacion;
    nueva.fechaPresentacion = parsed.fechaPresentacion;
    nueva.fechaAdjudicacion = parsed.fechaAdjudicacion;
    nueva.adjudicatarioNombre = parsed.adjudicatarioNombre;
    nueva.adjudicatarioNif = parsed.adjudicatarioNif;
    nueva.importeAdjudicacion = parsed.importeAdjudicacion;
    nueva.porcentajeBaja = parsed.porcentajeBaja;
    nueva.numLicitadores = parsed.numLicitadores;
    nueva.tieneLotes = parsed.tieneLotes;
    nueva.documentos = parsed.documentos;
    nueva.organoId = organoId;
    const saved = await licRepoTx.save(nueva);
    return {
      status: 'new',
      licitacion: saved,
    };
  }

  async upsert(
    parsed: ParsedLicitacion,
    manager?: EntityManager
  ): Promise<'new' | 'updated' | 'skipped'> {
    // Use manager repositories if available, otherwise use default repos
    const licRepoTx = manager
      ? manager.getRepository(Licitacion)
      : this.licRepo;
    const orgRepoTx = manager
      ? manager.getRepository(OrganoContratacion)
      : this.orgRepo;

    let organoId: string | null = null;
    if (parsed.organoExternalId) {
      organoId = await this.upsertOrgano(parsed, orgRepoTx);
    }

    const existing = await licRepoTx.findOneBy({
      externalId: parsed.externalId,
      source: parsed.source,
    });

    if (existing) {
      await licRepoTx.update(existing.id, {
        title: parsed.title,
        description: parsed.description,
        estado: parsed.estado,
        presupuestoBase: parsed.presupuestoBase,
        presupuestoConIva: parsed.presupuestoConIva,
        fechaPresentacion: parsed.fechaPresentacion,
        fechaAdjudicacion: parsed.fechaAdjudicacion,
        adjudicatarioNombre:
          parsed.adjudicatarioNombre || existing.adjudicatarioNombre,
        adjudicatarioNif: parsed.adjudicatarioNif || existing.adjudicatarioNif,
        importeAdjudicacion:
          parsed.importeAdjudicacion || existing.importeAdjudicacion,
        porcentajeBaja: parsed.porcentajeBaja ?? existing.porcentajeBaja,
        numLicitadores: parsed.numLicitadores ?? existing.numLicitadores,
        documentos:
          parsed.documentos.length > 0
            ? parsed.documentos
            : existing.documentos,
        organoId: organoId || existing.organoId,
      });
      return 'updated';
    }

    const nueva = licRepoTx.create();
    nueva.externalId = parsed.externalId;
    nueva.source = parsed.source;
    nueva.title = parsed.title;
    nueva.description = parsed.description;
    nueva.cpvCodes = parsed.cpvCodes;
    nueva.presupuestoBase = parsed.presupuestoBase;
    nueva.presupuestoConIva = parsed.presupuestoConIva;
    nueva.tipoContrato = parsed.tipoContrato;
    nueva.procedimiento = parsed.procedimiento;
    nueva.estado = parsed.estado;
    nueva.tramitacion = parsed.tramitacion;
    nueva.ccaa = parsed.ccaa;
    nueva.provincia = parsed.provincia;
    nueva.municipio = parsed.municipio;
    nueva.fechaPublicacion = parsed.fechaPublicacion;
    nueva.fechaPresentacion = parsed.fechaPresentacion;
    nueva.fechaAdjudicacion = parsed.fechaAdjudicacion;
    nueva.adjudicatarioNombre = parsed.adjudicatarioNombre;
    nueva.adjudicatarioNif = parsed.adjudicatarioNif;
    nueva.importeAdjudicacion = parsed.importeAdjudicacion;
    nueva.porcentajeBaja = parsed.porcentajeBaja;
    nueva.numLicitadores = parsed.numLicitadores;
    nueva.tieneLotes = parsed.tieneLotes;
    nueva.documentos = parsed.documentos;
    nueva.organoId = organoId;
    await licRepoTx.save(nueva);
    return 'new';
  }

   private async upsertOrgano(
    p: ParsedLicitacion,
    orgRepoTx?: Repository<OrganoContratacion>,
  ): Promise<string | null> {
    if (!p.organoExternalId) return null;
    const orgRepoToUse = orgRepoTx || this.orgRepo;
 
    const existing = await orgRepoToUse.findOneBy({
      externalId: p.organoExternalId,
    });
 
    if (existing) {
      // El órgano ya existe. Si los datos nuevos son MEJORES (el existente tiene
      // 'Desconocido' o nulls), actualizamos. Nunca degradamos datos buenos.
      const updates: Partial<OrganoContratacion> = {};
 
      if (
        p.organoNombre &&
        (!existing.nombre || existing.nombre === 'Desconocido')
      ) {
        updates.nombre = p.organoNombre;
      }
      if (p.organoTipo && !existing.tipo) {
        updates.tipo = p.organoTipo;
      }
      if (p.ccaa && !existing.ccaa) {
        updates.ccaa = p.ccaa;
      }
      if (p.provincia && !existing.provincia) {
        updates.provincia = p.provincia;
      }
 
      if (Object.keys(updates).length > 0) {
        await orgRepoToUse.update(existing.id, updates);
      }
      return existing.id;
    }
 
    // No existe: crear nuevo
    const nuevo = orgRepoToUse.create();
    nuevo.externalId = p.organoExternalId;
    nuevo.nombre = p.organoNombre || 'Desconocido';
    nuevo.tipo = p.organoTipo;
    nuevo.ccaa = p.ccaa;
    nuevo.provincia = p.provincia;
    nuevo.plataforma = 'PLACE';
    const saved = await orgRepoToUse.save(nuevo);
    return saved.id;
  }
}
