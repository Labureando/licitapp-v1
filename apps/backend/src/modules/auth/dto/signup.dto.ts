import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Timezone } from '../../../modules/users/enums';

/**
 * DTO para Signup/Registro (Step 1)
 * No incluye password - se solicita en POST /complete-signup/:token
 */
export class SignupDto {
  @ApiProperty({
    description: 'Email del usuario (debe ser único)',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
    type: String,
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
    type: String,
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    description: 'Número de teléfono (opcional)',
    example: '+34912345678',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Zona horaria del usuario (opcional, default: UTC)',
    example: 'Europe/Madrid',
    type: String,
    enum: Object.values(Timezone),
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: Timezone;
}
