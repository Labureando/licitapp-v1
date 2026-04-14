import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchLicitacionesDto {
  @ApiPropertyOptional({ description: 'Texto libre de búsqueda', example: 'limpieza hospitales' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado', example: 'ABIERTA', enum: ['ABIERTA', 'ADJUDICADA', 'CERRADA', 'RESUELTA', 'DESIERTA', 'ANULADA', 'ANUNCIO_PREVIO', 'DESCONOCIDO'] })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de contrato', example: 'SERVICIOS', enum: ['SERVICIOS', 'SUMINISTROS', 'OBRAS', 'CONCESION_SERVICIOS', 'CONCESION_OBRAS', 'MIXTO'] })
  @IsOptional()
  @IsString()
  tipoContrato?: string;

  @ApiPropertyOptional({ description: 'Filtrar por procedimiento', example: 'ABIERTO' })
  @IsOptional()
  @IsString()
  procedimiento?: string;

  @ApiPropertyOptional({ description: 'Filtrar por CCAA', example: 'Comunidad de Madrid' })
  @IsOptional()
  @IsString()
  ccaa?: string;

  @ApiPropertyOptional({ description: 'Filtrar por provincia', example: 'Madrid' })
  @IsOptional()
  @IsString()
  provincia?: string;

  @ApiPropertyOptional({ description: 'Código CPV', example: '45000000' })
  @IsOptional()
  @IsString()
  cpv?: string;

  @ApiPropertyOptional({ description: 'Presupuesto mínimo (céntimos)', example: 1000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  importeMin?: number;

  @ApiPropertyOptional({ description: 'Presupuesto máximo (céntimos)', example: 50000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  importeMax?: number;

  @ApiPropertyOptional({ description: 'Fecha publicación desde (ISO)', example: '2026-01-01' })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha publicación hasta (ISO)', example: '2026-12-31' })
  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @ApiPropertyOptional({ description: 'Solo con plazo abierto', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  soloConPlazo?: boolean;

  @ApiPropertyOptional({ description: 'ID del órgano de contratación' })
  @IsOptional()
  @IsString()
  organoId?: string;

  @ApiPropertyOptional({ description: 'Página (empieza en 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Resultados por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Ordenar por', default: 'fecha', enum: ['fecha', 'relevancia', 'importe', 'deadline'] })
  @IsOptional()
  @IsString()
  sortBy?: 'fecha' | 'relevancia' | 'importe' | 'deadline' = 'fecha';

  @ApiPropertyOptional({ description: 'Orden', default: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
