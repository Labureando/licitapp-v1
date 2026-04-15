import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { Role, UserPlan } from '../enums';

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
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.PUBLIC_USER;

  /**
   * Plan del usuario (solo para PUBLIC_USER sin organizationId)
   */
  @IsEnum(UserPlan)
  @IsOptional()
  userPlan?: UserPlan = UserPlan.FREE;

  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
