import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceScraperService } from './services/place-scraper.service';
import { PlaceHistoricalService } from './services/place-historical.service';
import { Licitacion } from './entities/licitacion.entity';
import { ScrapingLog } from './entities/scraping-log.entity';

@ApiTags('Scraping')
@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly placeScraper: PlaceScraperService,
    private readonly placeHistorical: PlaceHistoricalService,
    @InjectRepository(Licitacion)
    private readonly licitacionRepo: Repository<Licitacion>,
    @InjectRepository(ScrapingLog)
    private readonly logRepo: Repository<ScrapingLog>,
  ) {}

  @Post('place/run')
  @ApiOperation({ summary: 'Ejecutar scraping de PLACE manualmente (max 3 páginas)' })
  async runPlace() {
    return this.placeScraper.scrapeCurrentFeed(3);
  }

  @Post('place/historical/:period')
  @ApiOperation({ summary: 'Cargar histórico de PLACE. Ej: 2024, 202604' })
  async loadHistorical(@Param('period') period: string) {
    return this.placeHistorical.loadHistorical(period);
  }

  @Post('place/historical-all')
  @ApiOperation({ summary: 'Cargar TODO el histórico (2024-presente). Tarda 30-60 min.' })
  async loadAll() {
    return this.placeHistorical.loadAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de licitaciones en BD' })
  async stats() {
    const total = await this.licitacionRepo.count();
    const abiertas = await this.licitacionRepo.count({ where: { estado: 'ABIERTA' } });
    const adjudicadas = await this.licitacionRepo.count({ where: { estado: 'ADJUDICADA' } });
    const lastLog = await this.logRepo.findOne({
      where: { source: 'PLACE' },
      order: { startedAt: 'DESC' },
    });

    return {
      totalLicitaciones: total,
      abiertas,
      adjudicadas,
      ultimoScraping: lastLog ? {
        fecha: lastLog.startedAt,
        estado: lastLog.status,
        nuevas: lastLog.itemsNew,
        actualizadas: lastLog.itemsUpdated,
        errores: lastLog.itemsErrors,
        duracion: `${lastLog.duration}ms`,
      } : null,
    };
  }
}