import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/auth/jwt-auth.guard';
import { OwnershipGuard } from '../guards/authorization/ownership.guard';
import { ValidateOwnership } from './validate-ownership.decorator';

/**
 * Decorador compuesto para endpoints seguros con validación de propiedad
 * 
 * Aplica automáticamente:
 * 1. @ApiBearerAuth() - Documentación Swagger
 * 2. @UseGuards(JwtAuthGuard) - Validar JWT token
 * 3. @UseGuards(OwnershipGuard) - Validar propiedad del recurso
 * 4. @ValidateOwnership(paramName) - Marca parámetro a validar
 * 5. @ApiForbiddenResponse() - Documentación de 403
 * 6. @ApiUnauthorizedResponse() - Documentación de 401
 * 
 * **Ventajas:**
 * - Menos decoradores por endpoint
 * - Consistencia garantizada
 * - Fácil mantener cambios globales
 * - Self-documenting (dice qué hace)
 * 
 * @param paramName - Nombre del parámetro de ruta (ej: 'id', 'tagId')
 * 
 * @example
 *   // ANTES (3 líneas):
 *   @Patch(':id')
 *   @ApiBearerAuth()
 *   @UseGuards(JwtAuthGuard, OwnershipGuard)
 *   @ValidateOwnership('id')
 *   async updateTag(...) { }
 * 
 *   // DESPUÉS (1 línea):
 *   @Patch(':id')
 *   @SecureOwnershipEndpoint('id')
 *   async updateTag(...) { }
 * 
 * @see OwnershipGuard
 * @see JwtAuthGuard
 */
export const SecureOwnershipEndpoint = (paramName: string) =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Token JWT inválido o expirado (401)',
    }),
    ApiForbiddenResponse({
      description: 'No tienes permisos para acceder este recurso (403)',
    }),
    UseGuards(JwtAuthGuard, OwnershipGuard),
    ValidateOwnership(paramName),
  );

/**
 * Decorador compuesto para endpoints que solo requieren autenticación
 * (sin validación de propiedad)
 * 
 * Aplica automáticamente:
 * 1. @ApiBearerAuth()
 * 2. @UseGuards(JwtAuthGuard)
 * 3. @ApiUnauthorizedResponse()
 * 
 * @example
 *   @Get()
 *   @SecureAuthEndpoint()
 *   async getAllTags(@CurrentUser() userId: string) { }
 */
export const SecureAuthEndpoint = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Token JWT inválido o expirado (401)',
    }),
    UseGuards(JwtAuthGuard),
  );
