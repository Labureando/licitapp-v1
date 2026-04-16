import { IsNotEmpty, IsString, IsOptional, IsUrl, Length, MinLength, Matches } from 'class-validator';

/**
 * DTO para crear una nueva organización
 * Usado cuando un PUBLIC_USER crea su primera organización (automáticamente se convierte en ORG_OWNER)
 */
export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Length(3, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsUrl()
  @Length(0, 255)
  website?: string;

  @IsOptional()
  @IsUrl()
  @Length(0, 255)
  logo?: string;

  @IsOptional()
  @Matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
    message: 'El teléfono debe tener un formato válido (ej: +34 912345678)',
  })
  phone?: string;

  @IsOptional()
  @Matches(/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-Z]$/, {
    message: 'El CIF debe tener un formato válido español (ej: A12345678)',
  })
  cif?: string;
}
