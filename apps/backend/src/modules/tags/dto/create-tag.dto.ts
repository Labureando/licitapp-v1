import { IsString, IsNotEmpty, IsOptional, IsArray, IsHexColor, MaxLength, MinLength } from 'class-validator';

/**
 * DTO para crear una etiqueta global (solo admin)
 */
export class CreateGlobalTagDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;
}

/**
 * DTO para crear una etiqueta privada (usuario)
 */
export class CreatePrivateTagDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;
}

/**
 * DTO para actualizar una etiqueta
 */
export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;
}
