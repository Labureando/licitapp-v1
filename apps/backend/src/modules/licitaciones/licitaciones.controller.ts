import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LicitacionesService } from './licitaciones.service';
import { SearchLicitacionesDto } from './dto/search-licitaciones.dto';

// TODO: AUTH — Añadir @UseGuards(AuthGuard('jwt')) o @Public() cuando auth esté listo
@ApiTags('Licitaciones')
@Controller('licitaciones')
export class LicitacionesController {
  constructor(private readonly licitacionesService: LicitacionesService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar licitaciones con filtros',
    description: 'Búsqueda full-text + filtros por estado, tipo, ccaa, importe, fechas. Paginado.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de licitaciones' })
  async search(@Query() dto: SearchLicitacionesDto) {
    return this.licitacionesService.search(dto);
  }

  @Get('filters')
  @ApiOperation({
    summary: 'Opciones de filtros disponibles',
    description: 'Devuelve los valores únicos de estado, tipo, ccaa, procedimiento para poblar los dropdowns',
  })
  async getFilters() {
    return this.licitacionesService.getFilterOptions();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de una licitación',
    description: 'Devuelve todos los datos, documentos y órgano de contratación',
  })
  @ApiResponse({ status: 200, description: 'Detalle completo de la licitación' })
  @ApiResponse({ status: 404, description: 'Licitación no encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.licitacionesService.findById(id);
  }
}
