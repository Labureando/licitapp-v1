import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { CodiceParser, ParsedLicitacion } from '../parsers/codice.parser';
import { Licitacion } from '../entities/licitacion.entity';
import { OrganoContratacion } from '../entities/organo-contratacion.entity';
import { ScrapingLog } from '../entities/scraping-log.entity';
import * as https from 'https';

@Injectable()
export class PlaceScraperService {
  private readonly logger = new Logger(PlaceScraperService.name);
  private readonly FEED_URL =
    'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';

  constructor(
    @InjectRepository(Licitacion) private readonly licRepo: Repository<Licitacion>,
    @InjectRepository(OrganoContratacion) private readonly orgRepo: Repository<OrganoContratacion>,
    @InjectRepository(ScrapingLog) private readonly logRepo: Repository<ScrapingLog>,
    private readonly http: HttpService,
    private readonly parser: CodiceParser,
  ) {}

  async scrapeCurrentFeed(maxPages = 5) {
  
    const start = new Date();
   let newItems = 0, updatedItems = 0, errors = 0;

  let url: string | null = this.FEED_URL;  // ← URL fija, no por mes
  let page = 0;

    while (url && page < maxPages) {
      page++;
      this.logger.log(`[PLACE] Pág ${page}: ${url}`);
      try {
        const { data } = await this.http.axiosRef.get(url, {
       headers: { Accept: 'application/atom+xml' },
       responseType: 'text',
       timeout: 30000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
       });
       
        const { entries, nextUrl } = this.parser.parseAtomFeed(data);
        this.logger.log(`[PLACE] Pág ${page}: ${entries.length} entries`);

        for (const entry of entries) {
          try {
            const r = await this.upsert(entry);
            if (r === 'new') newItems++;
            else if (r === 'updated') updatedItems++;
          } catch (e) {
            errors++;
            if (errors <= 5) this.logger.warn(`[PLACE] Error upsert: ${e.message}`);
          }
        }
        url = nextUrl;
      } catch (e) {
        this.logger.error(`[PLACE] Error descarga: ${e.message}`);
        errors++; break;
      }
    }

    await this.logRepo.save({
      source: 'PLACE', status: errors > 0 ? 'PARTIAL' : 'SUCCESS',
      itemsNew: newItems, itemsUpdated: updatedItems, itemsErrors: errors,
      duration: Date.now() - start.getTime(), startedAt: start, finishedAt: new Date(),
    });

    this.logger.log(`[PLACE] Done: ${newItems} new, ${updatedItems} updated, ${errors} errors`);
    return { newItems, updatedItems, errors };
  }

  async upsert(parsed: ParsedLicitacion): Promise<'new' | 'updated' | 'skipped'> {
    let organoId: string | null = null;
    if (parsed.organoExternalId) organoId = await this.upsertOrgano(parsed);

    const existing = await this.licRepo.findOneBy({ externalId: parsed.externalId, source: parsed.source });

    if (existing) {
      await this.licRepo.update(existing.id, {
        title: parsed.title, description: parsed.description, estado: parsed.estado,
        presupuestoBase: parsed.presupuestoBase, presupuestoConIva: parsed.presupuestoConIva,
        fechaPresentacion: parsed.fechaPresentacion, fechaAdjudicacion: parsed.fechaAdjudicacion,
        adjudicatarioNombre: parsed.adjudicatarioNombre || existing.adjudicatarioNombre,
        adjudicatarioNif: parsed.adjudicatarioNif || existing.adjudicatarioNif,
        importeAdjudicacion: parsed.importeAdjudicacion || existing.importeAdjudicacion,
        porcentajeBaja: parsed.porcentajeBaja ?? existing.porcentajeBaja,
        numLicitadores: parsed.numLicitadores ?? existing.numLicitadores,
        documentos: parsed.documentos.length > 0 ? parsed.documentos : existing.documentos,
        organoId: organoId || existing.organoId,
      });
      return 'updated';
    }

  const nueva = this.licRepo.create();
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
await this.licRepo.save(nueva);
    return 'new';
  }

 private async upsertOrgano(p: ParsedLicitacion): Promise<string | null> {
  if (!p.organoExternalId) return null;
  let org = await this.orgRepo.findOneBy({ externalId: p.organoExternalId });
  if (!org) {
    const nuevo = this.orgRepo.create();
    nuevo.externalId = p.organoExternalId;
    nuevo.nombre = p.organoNombre || 'Desconocido';
    nuevo.tipo = p.organoTipo;
    nuevo.ccaa = p.ccaa;
    nuevo.plataforma = 'PLACE';
    org = await this.orgRepo.save(nuevo);
  }
  return org.id;
}
}