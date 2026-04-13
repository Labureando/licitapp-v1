import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import AdmZip from 'adm-zip';
import { CodiceParser } from '../parsers/codice.parser';
import { Licitacion } from '../entities/licitacion.entity';
import { OrganoContratacion } from '../entities/organo-contratacion.entity';
import { ScrapingLog } from '../entities/scraping-log.entity';
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
  ) {}

  async loadHistorical(period: string): Promise<{ newItems: number; errors: number; duration: string }> {
    const startedAt = new Date();
    let newItems = 0, errors = 0;
    const url = `${this.ZIP_BASE}_${period}.zip`;

    this.logger.log(`[HIST] Descargando: ${url}`);

    try {
      const { data } = await this.http.axiosRef.get(url, {
      responseType: 'arraybuffer',
      timeout: 180000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
     });

      this.logger.log(`[HIST] ZIP descargado: ${(data.byteLength / 1024 / 1024).toFixed(1)} MB`);

      const zip = new AdmZip(Buffer.from(data));
      const entries = zip.getEntries();

      this.logger.log(`[HIST] ${entries.length} ficheros en el ZIP`);

      for (const zipEntry of entries) {
        if (!zipEntry.entryName.endsWith('.atom') && !zipEntry.entryName.endsWith('.xml')) continue;

        try {
          const xml = zipEntry.getData().toString('utf-8');
          const { entries: licitaciones } = this.parser.parseAtomFeed(xml);

          for (const lic of licitaciones) {
            try {
              await this.scraper.upsert(lic);
              newItems++;
            } catch {
              errors++;
            }
          }

          if (newItems % 1000 === 0 && newItems > 0) {
            this.logger.log(`[HIST] Progreso: ${newItems} insertadas, ${errors} errores`);
          }
        } catch (err) {
          this.logger.error(`[HIST] Error en ${zipEntry.entryName}: ${err.message}`);
          errors++;
        }
      }
    } catch (err) {
      this.logger.error(`[HIST] Error descargando ${url}: ${err.message}`);
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

    this.logger.log(`[HIST] ${period} completado: ${newItems} nuevas, ${errors} errores, ${duration}s`);
    return { newItems, errors, duration: `${duration}s` };
  }

  async loadAll() {
    const periods = ['2024', '2025', '202601', '202602', '202603', '202604'];
    const results: any[] = [];

    for (const p of periods) {
      this.logger.log(`[HIST] === Cargando ${p} ===`);
      const result = await this.loadHistorical(p);
      results.push({ period: p, ...result });
    }

    return results;
  }
}