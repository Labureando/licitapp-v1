/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { LicitacionesService } from './licitaciones.service';
import { SearchLicitacionesDto } from './dto/search-licitaciones.dto';
import { ValidateResourceExists, EnableSoftDelete } from '../../common/decorators';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

@ApiTags('📋 Licitaciones')
@Controller('licitaciones')
export class LicitacionesController {
  constructor(private readonly licitacionesService: LicitacionesService) {}

  /**
   * Buscar licitaciones con filtros avanzados
   */
  @Get()
  @ApiOperation({
    summary: 'Buscar licitaciones',
    description:
      'Búsqueda full-text sobre títulos/descripciones + filtros por estado, tipo, CCAA, provincia, importe, fechas, órgano, CPV. Soporta paginación y ordenación.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Texto a buscar (full-text)',
    example: 'obras mantenimiento',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    type: String,
    description: 'Estados separados por coma: ABIERTA,ADJUDICADA,CERRADA',
    example: 'ABIERTA,ADJUDICADA',
  })
  @ApiQuery({
    name: 'tipoContrato',
    required: false,
    type: String,
    description: 'Tipos de contrato separados por coma: OBRAS,SERVICIOS,SUMINISTROS',
    example: 'SERVICIOS,SUMINISTROS',
  })
  @ApiQuery({
    name: 'procedimiento',
    required: false,
    type: String,
    description: 'Procedimientos: ABIERTO,RESTRINGIDO,NEGOCIADO_CON_PUBLICIDAD',
    example: 'ABIERTO',
  })
  @ApiQuery({
    name: 'tramitacion',
    required: false,
    type: String,
    description: 'Tramitación: ORDINARIA,URGENTE',
    example: 'ORDINARIA',
  })
  @ApiQuery({
    name: 'ccaa',
    required: false,
    type: String,
    description: 'Comunidades Autónomas separadas por coma',
    example: 'Madrid,Cataluña',
  })
  @ApiQuery({
    name: 'provincia',
    required: false,
    type: String,
    description: 'Provincias separadas por coma',
    example: 'Madrid,Barcelona',
  })
  @ApiQuery({
    name: 'cpv',
    required: false,
    type: String,
    description: 'Código CPV (clasificación de productos)',
    example: '45000000',
  })
  @ApiQuery({
    name: 'organoId',
    required: false,
    type: String,
    description: 'UUID del órgano de contratación',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'importeMin',
    required: false,
    type: Number,
    description: 'Importe mínimo en céntimos',
    example: 10000,
  })
  @ApiQuery({
    name: 'importeMax',
    required: false,
    type: Number,
    description: 'Importe máximo en céntimos',
    example: 500000,
  })
  @ApiQuery({
    name: 'fechaDesde',
    required: false,
    type: String,
    description: 'Fecha desde (ISO 8601)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'fechaHasta',
    required: false,
    type: String,
    description: 'Fecha hasta (ISO 8601)',
    example: '2026-12-31',
  })
  @ApiQuery({
    name: 'soloConPlazo',
    required: false,
    type: Boolean,
    description: 'Solo licitaciones con plazo abierto',
    example: true,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['fecha', 'importe', 'deadline'],
    description: 'Campo para ordenar',
    example: 'fecha',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Dirección de ordenamiento',
    example: 'DESC',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Resultados por página (default: 20, max: 100)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Búsqueda exitosa con resultados paginados',
    schema: {
      example: {
        data: [
          {
            id: 'lic-uuid',
            titulo: 'Obras de mejora en C/ Principal',
            estado: 'ABIERTA',
            tipoContrato: 'OBRAS',
            importe: 500000,
            plazoPresentacion: '2026-05-15',
            organoNombre: 'Ayuntamiento de Madrid',
          },
        ],
        total: 250,
        page: 1,
        limit: 20,
        pages: 13,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Parámetros inválidos' })
  async search(@Query() dto: SearchLicitacionesDto) {
    return this.licitacionesService.search(dto);
  }

  /**
   * Obtener opciones de filtros
   */
  @Get('filters')
  @ApiOperation({
    summary: 'Obtener opciones de filtros',
    description:
      'Devuelve todos los valores disponibles para filtros: estados, tipos de contrato, procedimientos, tramitaciones, CCAA, provincias y órganos de contratación más activos.',
  })
  @ApiOkResponse({
    description: 'Opciones de filtros obtenidas exitosamente',
    schema: {
      example: {
        estados: [
          { value: 'ABIERTA', count: 245 },
          { value: 'CERRADA', count: 189 },
        ],
        tipos: [{ value: 'SERVICIOS', count: 312 }],
        procedimientos: [{ value: 'ABIERTO', count: 450 }],
        tramitaciones: [{ value: 'ORDINARIA', count: 600 }],
        ccaas: [
          { value: 'Madrid', count: 450 },
          { value: 'Cataluña', count: 380 },
        ],
        provincias: [
          { value: 'Madrid', count: 300 },
          { value: 'Barcelona', count: 250 },
        ],
        organos: [
          {
            id: 'org-uuid',
            nombre: 'Ayuntamiento de Madrid',
            ccaa: 'Madrid',
            provincia: 'Madrid',
            totalLicitaciones: 156,
          },
        ],
      },
    },
  })
  async getFilters() {
    return this.licitacionesService.getFilterOptions();
  }

  /**
   * Obtener detalle de una licitación
   */
  @Get(':id')
  @ValidateResourceExists(Licitacion, 'id')
  @EnableSoftDelete()
  @ApiOperation({
    summary: 'Obtener detalle de licitación',
    description:
      'Retorna todos los datos completos de una licitación: información general, documentos, cronograma, órgano de contratación, criterios de adjudicación.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'ID único de la licitación',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Detalle de licitación obtenido exitosamente',
    schema: {
      example: {
        id: 'lic-uuid',
        titulo: 'Obras de mejora en C/ Principal',
        descripcion: 'Descripción detallada...',
        estado: 'ABIERTA',
        tipoContrato: 'OBRAS',
        importe: 500000,
        importeMin: 450000,
        importeMax: 550000,
        plazoPresentacion: '2026-05-15T23:59:59Z',
        fechaPublicacion: '2026-04-01T10:00:00Z',
        procedimiento: 'ABIERTO',
        tramitacion: 'ORDINARIA',
        cpv: '45000000',
        organo: {
          id: 'org-uuid',
          nombre: 'Ayuntamiento de Madrid',
          ccaa: 'Madrid',
          provincia: 'Madrid',
        },
        documentos: [
          {
            id: 'doc-uuid',
            nombre: 'Bases técnicas',
            url: 'https://...',
            tipo: 'PDF',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Licitación no encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.licitacionesService.findById(id);
  }
}
