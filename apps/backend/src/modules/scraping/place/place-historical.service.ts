import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import AdmZip from 'adm-zip';
import {
  CodiceParser,
  ParsedLicitacion,
} from '../shared/parsers/codice.parser';
import { ScrapingLog } from '../shared/entities/scraping-log.entity';
import { PlaceScraperService } from './place-scraper.service';
import * as https from 'https';

@Injectable()
export class PlaceHistoricalService {
  private readonly logger = new Logger(PlaceHistoricalService.name);
  private readonly ZIP_BASE =
    'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3';

  constructor(
    @InjectRepository(ScrapingLog)
    private readonly logRepo: Repository<ScrapingLog>,
    private readonly http: HttpService,
    private readonly parser: CodiceParser,
    private readonly scraper: PlaceScraperService,
    private readonly dataSource: DataSource
  ) {}

  async loadHistorical(period: string): Promise<{
    newItems: number;
    errors: number;
    duration: string;
  }> {
    const startedAt = new Date();
    let newItems = 0,
      errors = 0;
    const url = `${this.ZIP_BASE}_${period}.zip`;

    this.logger.log(`[HIST] Descargando: ${url}`);

    try {
      const response = await this.http.axiosRef.get<Buffer>(url, {
        responseType: 'arraybuffer',
        timeout: 180000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });

      const buffer = Buffer.isBuffer(response.data)
        ? response.data
        : Buffer.from(response.data as unknown as ArrayBuffer);

      this.logger.log(
        `[HIST] ZIP descargado: ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`
      );

      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      this.logger.log(`[HIST] ${entries.length} ficheros en el ZIP`);

      for (const zipEntry of entries) {
        if (
          !zipEntry.entryName.endsWith('.atom') &&
          !zipEntry.entryName.endsWith('.xml')
        )
          continue;

        try {
          const xml = zipEntry.getData().toString('utf-8');
          const { entries: licitaciones } = this.parser.parseAtomFeed(xml);

          const fileResult = await this.processLicitacionesInTransaction(
            licitaciones,
            zipEntry.entryName
          );
          newItems += fileResult.newItems;
          errors += fileResult.errors;

          if (newItems % 1000 === 0 && newItems > 0) {
            this.logger.log(
              `[HIST] Progreso: ${newItems} insertadas, ${errors} errores`
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          this.logger.error(`[HIST] Error en ${zipEntry.entryName}: ${msg}`);
          errors++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`[HIST] Error descargando ${url}: ${msg}`);
      errors++;
    }

    const duration = ((Date.now() - startedAt.getTime()) / 1000).toFixed(0);

    await this.logRepo.save({
      source: `PLACE_HIST_${period}`,
      status: errors > 0 ? 'PARTIAL' : 'SUCCESS',
      itemsNew: newItems,
      itemsErrors: errors,
      duration: Date.now() - startedAt.getTime(),
      startedAt,
      finishedAt: new Date(),
    });

    this.logger.log(
      `[HIST] ${period} completado: ${newItems} nuevas, ${errors} errores, ${duration}s`
    );
    return { newItems, errors, duration: `${duration}s` };
  }

  async loadAll(): Promise<
    Array<{
      period: string;
      newItems: number;
      errors: number;
      duration: string;
    }>
  > {
    const periods = ['2024', '2025', '202601', '202602', '202603', '202604'];
    const results: Array<{
      period: string;
      newItems: number;
      errors: number;
      duration: string;
    }> = [];

    for (const p of periods) {
      this.logger.log(`[HIST] === Cargando ${p} ===`);
      const result = await this.loadHistorical(p);
      results.push({ period: p, ...result });
    }

    return results;
  }

  private async processLicitacionesInTransaction(
    licitaciones: ParsedLicitacion[],
    fileName: string
  ): Promise<{
    newItems: number;
    errors: number;
  }> {
    let newItems = 0;
    let errors = 0;

    // Procesar órganos PRIMERO (independiente)
    const organoMap = new Map<string, string | null>();

    for (const lic of licitaciones) {
      if (lic.organoExternalId && !organoMap.has(lic.organoExternalId)) {
        try {
          const organoId = await this.scraper['upsertOrganoWithRetry'](lic, 3);
          organoMap.set(lic.organoExternalId, organoId);
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `[HIST] Órgano falló en ${fileName}: ${msg}. Continuando sin este órgano.`
          );
          organoMap.set(lic.organoExternalId, null);
        }
      }
    }

    // Procesar licitaciones DESPUÉS (transacción por lote)
    for (const lic of licitaciones) {
      try {
        const result = await this.scraper.upsert(
          lic,
          undefined // Cada licitación con su transacción separada
        );
        if (result === 'new') newItems++;
      } catch (e) {
        errors++;
        if (errors <= 10) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          this.logger.warn(`[HIST] Error procesando ${fileName}: ${msg}`);
        }
      }
    }

    return { newItems, errors };
  }
}
