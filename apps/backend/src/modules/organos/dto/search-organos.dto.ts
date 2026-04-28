import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function parseCommaList(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return undefined;
}

export class SearchOrganosDto {
  @ApiPropertyOptional({ description: 'Texto de búsqueda' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'CCAAs (comma-separated)' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseCommaList(value))
  ccaa?: string[];

  @ApiPropertyOptional({ description: 'Provincias (comma-separated)' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseCommaList(value))
  provincia?: string[];

  @ApiPropertyOptional({ default: 30, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 30;
}