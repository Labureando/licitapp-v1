import { IsString, IsOptional, IsEnum, IsBoolean, IsEmail, Matches } from 'class-validator';
import { Role, Plan, Timezone } from '../enums';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @Matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
    message: 'El teléfono debe tener un formato válido (ej: +34 912345678)',
  })
  @IsOptional()
  phone?: string;

  @IsEnum(Timezone)
  @IsOptional()
  timezone?: Timezone;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  /**
   * Actualizar plan del usuario (solo para PUBLIC_USER)
   */
  @IsEnum(Plan)
  @IsOptional()
  userPlan?: Plan;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
