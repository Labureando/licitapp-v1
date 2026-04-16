import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsUUID, IsOptional, Matches } from 'class-validator';
import { Role, Plan, Timezone } from '../enums';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @Matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
    message: 'El teléfono debe tener un formato válido (ej: +34 912345678)',
  })
  @IsOptional()
  phone?: string;

  @IsEnum(Timezone)
  @IsOptional()
  timezone?: Timezone = Timezone.UTC;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.PUBLIC_USER;

  /**
   * Plan del usuario (solo para PUBLIC_USER sin organizationId)
   */
  @IsEnum(Plan)
  @IsOptional()
  userPlan?: Plan = Plan.FREE;

  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
