import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEmail, IsBoolean } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la alerta',
    example: 'Licitaciones de Servicios de Limpieza',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la alerta',
    example: 'Busca todas las licitaciones de servicios de limpieza en Cataluña',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Email donde enviar las notificaciones (por defecto email del usuario)',
    example: 'alerts@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Estados de licitación a filtrar',
    example: ['ABIERTA', 'CERRADA'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  estados?: string[];

  @ApiPropertyOptional({
    description: 'Tipos de contrato a filtrar',
    example: ['SERVICIO', 'OBRA'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tiposContrato?: string[];

  @ApiPropertyOptional({
    description: 'Procedimientos a filtrar',
    example: ['ABIERTO', 'RESTRINGIDO'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  procedimientos?: string[];

  @ApiPropertyOptional({
    description: 'Tramitaciones a filtrar',
    example: ['ORDINARIA', 'URGENTE'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tramitaciones?: string[];

  @ApiPropertyOptional({
    description: 'Comunidades autónomas a filtrar',
    example: ['Cataluña', 'Madrid'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccaas?: string[];

  @ApiPropertyOptional({
    description: 'Provincias a filtrar',
    example: ['Barcelona', 'Madrid'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  provincias?: string[];

  @ApiPropertyOptional({
    description: 'Códigos CPV a filtrar',
    example: ['72000000', '79000000'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cpvCodes?: string[];

  @ApiPropertyOptional({
    description: 'Importe mínimo',
    example: '10000',
  })
  @IsOptional()
  @IsString()
  importeMin?: string;

  @ApiPropertyOptional({
    description: 'Importe máximo',
    example: '100000',
  })
  @IsOptional()
  @IsString()
  importeMax?: string;

  @ApiPropertyOptional({
    description: 'Palabras clave a buscar (búsqueda full-text)',
    example: 'servicios tecnológicos',
  })
  @IsOptional()
  @IsString()
  palabrasClave?: string;

  @ApiPropertyOptional({
    description: 'Si la alerta está activa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
