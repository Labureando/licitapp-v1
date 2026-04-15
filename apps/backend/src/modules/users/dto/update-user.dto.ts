import { IsString, IsOptional, IsEnum, IsBoolean, IsEmail } from 'class-validator';
import { Role, UserPlan } from '../enums';

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

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  /**
   * Actualizar plan del usuario (solo para PUBLIC_USER)
   */
  @IsEnum(UserPlan)
  @IsOptional()
  userPlan?: UserPlan;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
