import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO para solicitar cambio de contraseña
 */
export class RequestPasswordChangeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * DTO para confirmar cambio de contraseña con token
 */
export class ConfirmPasswordChangeDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;
}

/**
 * DTO para cambio directo de contraseña (usuario logueado)
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;
}
