import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Completar Signup (Step 2)
 */
export class CompleteSignupDto {
  @ApiProperty({
    description: 'Contraseña nueva (mínimo 8 caracteres, debe incluir mayúscula, minúscula, número)',
    example: 'SecurePassword123!',
    type: String,
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Confirmación de contraseña (debe ser igual a password)',
    example: 'SecurePassword123!',
    type: String,
  })
  @IsString()
  passwordConfirm: string;
}
