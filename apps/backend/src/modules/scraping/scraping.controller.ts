/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceScraperService } from './place/place-scraper.service';
import { PlaceHistoricalService } from './place/place-historical.service';
import { Licitacion } from './shared/entities/licitacion.entity';
import { ScrapingLog } from './shared/entities/scraping-log.entity';
import { RunPlaceDto, LoadHistoricalDto, ScrapingResultDto } from './dto/index';

@ApiTags('Scraping')
@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly placeScraper: PlaceScraperService,
    private readonly placeHistorical: PlaceHistoricalService,
    @InjectRepository(Licitacion)
    private readonly licitacionRepo: Repository<Licitacion>,
    @InjectRepository(ScrapingLog)
    private readonly logRepo: Repository<ScrapingLog>
  ) {}

  @Post('place/run')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ejecutar scraping de PLACE manualmente',
    description:
      'Scrappea las últimas licitaciones de PLACE (páginas configurables)',
  })
  @ApiResponse({
    status: 202,
    description: 'Scraping iniciado exitosamente',
    type: ScrapingResultDto,
  })
  async runPlace(@Body() dto: RunPlaceDto) {
    return this.placeScraper.scrapeCurrentFeed(dto.maxPages ?? 3);
  }

  @Post('place/historical/:period')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Cargar histórico de PLACE por período',
    description:
      'Descarga y procesa un ZIP con licitaciones del período especificado',
  })
  @ApiParam({
    name: 'period',
    description: 'Período en formato YYYY o YYYYMM (ej: 2024, 202604)',
    example: '202604',
  })
  @ApiResponse({
    status: 202,
    description: 'Carga de histórico iniciada',
    type: ScrapingResultDto,
  })
  async loadHistorical(@Param() params: LoadHistoricalDto) {
    return this.placeHistorical.loadHistorical(params.period);
  }

  @Post('place/historical-all')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Cargar TODO el histórico de PLACE',
    description:
      'Procesa todos los períodos de 2024 hasta presente (30-60 min)',
  })
  @ApiResponse({
    status: 202,
    description: 'Carga completa iniciada',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          period: { example: '2024' },
          newItems: { example: 1000 },
          errors: { example: 5 },
          duration: { example: '60s' },
        },
      },
    },
  })
  async loadAll() {
    return this.placeHistorical.loadAll();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de licitaciones',
    description:
      'Retorna conteos de licitaciones por estado y datos del último scraping',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas',
    schema: {
      type: 'object',
      properties: {
        totalLicitaciones: { type: 'number', example: 5420 },
        abiertas: { type: 'number', example: 1230 },
        adjudicadas: { type: 'number', example: 4190 },
        ultimoScraping: {
          type: 'object',
          nullable: true,
          properties: {
            fecha: { type: 'string', format: 'date-time' },
            estado: { type: 'string', enum: ['SUCCESS', 'PARTIAL', 'PENDING'] },
            nuevas: { type: 'number' },
            actualizadas: { type: 'number' },
            errores: { type: 'number' },
            duracion: { type: 'string', example: '5230ms' },
          },
        },
      },
    },
  })
  async stats() {
    const total = await this.licitacionRepo.count();
    const abiertas = await this.licitacionRepo.count({
      where: { estado: 'ABIERTA' },
    });
    const adjudicadas = await this.licitacionRepo.count({
      where: { estado: 'ADJUDICADA' },
    });
    const lastLog = await this.logRepo.findOne({
      where: { source: 'PLACE' },
      order: { startedAt: 'DESC' },
    });

    return {
      totalLicitaciones: total,
      abiertas,
      adjudicadas,
      ultimoScraping: lastLog
        ? {
            fecha: lastLog.startedAt,
            estado: lastLog.status,
            nuevas: lastLog.itemsNew,
            actualizadas: lastLog.itemsUpdated,
            errores: lastLog.itemsErrors,
            duracion: `${lastLog.duration}ms`,
          }
        : null,
    };
  }

  @Post('migrations/update-search-vector')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar searchVector para búsqueda full-text',
    description:
      'Recalcula el campo searchVector para todas las licitaciones existentes. Necesario después de scraping masivo.',
  })
  @ApiResponse({
    status: 200,
    description: 'SearchVector actualizado',
    schema: {
      type: 'object',
      properties: {
        updatedCount: { type: 'number', example: 2028 },
        duration: { type: 'string', example: '3450ms' },
      },
    },
  })
  async updateSearchVector() {
    const start = Date.now();
    try {
      const result = await this.licitacionRepo.query(`
        UPDATE licitaciones SET "searchVector" =
          setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
          setweight(to_tsvector('spanish', COALESCE(description, '')), 'B') ||
          setweight(to_tsvector('spanish', COALESCE("adjudicatarioNombre", '')), 'C') ||
          setweight(to_tsvector('spanish', COALESCE("adjudicatarioNif", '')), 'C')
        WHERE "searchVector" IS NULL OR "searchVector" = ''::tsvector;
      `);

      const duration = Date.now() - start;
      return {
        updatedCount: result.affectedRows ?? result,
        duration: `${duration}ms`,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update searchVector: ${msg}`);
    }
  }

  @Post('migrations/create-search-trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Crear trigger para auto-actualizar searchVector',
    description:
      'Crea el trigger en PostgreSQL que auto-actualiza searchVector cuando se inserta/actualiza una licitación. Debe ejecutarse UNA SOLA VEZ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Trigger creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Trigger creado' },
        triggerName: { type: 'string', example: 'trg_licitaciones_search' },
      },
    },
  })
  async createSearchTrigger() {
    try {
      // Ejecutar cada comando por separado
      await this.licitacionRepo.query(`
        CREATE OR REPLACE FUNCTION licitaciones_search_trigger()
        RETURNS trigger AS $$
        BEGIN
          NEW."searchVector" :=
            setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
            setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
            setweight(to_tsvector('spanish', COALESCE(NEW."adjudicatarioNombre", '')), 'C') ||
            setweight(to_tsvector('spanish', COALESCE(NEW."adjudicatarioNif", '')), 'C');
          RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
      `);

      await this.licitacionRepo.query(`
        DROP TRIGGER IF EXISTS trg_licitaciones_search ON licitaciones;
      `);

      await this.licitacionRepo.query(`
        CREATE TRIGGER trg_licitaciones_search
        BEFORE INSERT OR UPDATE OF title, description, "adjudicatarioNombre", "adjudicatarioNif"
        ON licitaciones
        FOR EACH ROW EXECUTE FUNCTION licitaciones_search_trigger();
      `);

      // Crear índice GIN si no existe
      await this.licitacionRepo.query(`
        CREATE INDEX IF NOT EXISTS idx_licitaciones_search
        ON licitaciones USING GIN ("searchVector");
      `);

      return {
        message: 'Trigger y función creados exitosamente',
        triggerName: 'trg_licitaciones_search',
        functionName: 'licitaciones_search_trigger()',
        indexName: 'idx_licitaciones_search',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create trigger: ${msg}`);
    }
  }
}
