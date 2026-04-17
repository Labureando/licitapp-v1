import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Transforma "A,B,C" en ['A','B','C']. Tolera arrays ya parseados.
 */
function parseCommaList(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return undefined;
}

export class SearchLicitacionesDto {
  // ═══════════════════════════════════════════════
  // Full-text
  // ═══════════════════════════════════════════════

  @ApiPropertyOptional({ description: 'Búsqueda full-text' })
  @IsOptional()
  @IsString()
  q?: string;

  // ═══════════════════════════════════════════════
  // Filtros multi-select (arrays)
  // ═══════════════════════════════════════════════

  @ApiPropertyOptional({ description: 'Estados (separados por coma): ABIERTA,ADJUDICADA' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseCommaList(value))
  estado?: string[];

  @ApiPropertyOptional({ description: 'Tipos de contrato (separados por coma)' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseCommaList(value))
  tipoContrato?: string[];

  @ApiPropertyOptional({ description: 'Procedimientos (separados por coma)' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseCommaList(value))
  procedimiento?: string[];

  @ApiPropertyOptional({ description: 'Tramitaciones (separadas por coma)' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseCommaList(value))
  tramitacion?: string[];

  @ApiPropertyOptional({ description: 'CCAAs (separadas por coma)' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseCommaList(value))
  ccaa?: string[];

  @ApiPropertyOptional({ description: 'Provincias (separadas por coma)' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseCommaList(value))
  provincia?: string[];

  // ═══════════════════════════════════════════════
  // Filtros single-value / rangos
  // ═══════════════════════════════════════════════

  @ApiPropertyOptional({ description: 'Código CPV' })
  @IsOptional()
  @IsString()
  cpv?: string;

  @ApiPropertyOptional({ description: 'Importe mínimo (en céntimos)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  importeMin?: number;

  @ApiPropertyOptional({ description: 'Importe máximo (en céntimos)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  importeMax?: number;

  @ApiPropertyOptional({ description: 'Fecha desde (ISO)' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO)' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({ description: 'Solo licitaciones con plazo abierto' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  soloConPlazo?: boolean;

  @ApiPropertyOptional({ description: 'ID del órgano de contratación' })
  @IsOptional()
  @IsUUID()
  organoId?: string;

  // ═══════════════════════════════════════════════
  // Ordenación
  // ═══════════════════════════════════════════════

  @ApiPropertyOptional({ enum: ['fecha', 'importe', 'deadline'] })
  @IsOptional()
  @IsIn(['fecha', 'importe', 'deadline'])
  sortBy?: 'fecha' | 'importe' | 'deadline';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  // ═══════════════════════════════════════════════
  // Paginación
  // ═══════════════════════════════════════════════

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}