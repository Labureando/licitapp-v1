import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para marcar endpoint que requiere validación de ownership
 * Se usa con @UseGuards(OwnershipGuard)
 *
 * El guard validará que:
 * 1. Usuario está autenticado (request.user.id existe)
 * 2. Parámetro con ID de recurso existe
 * 3. El service validará que userId es propietario de ese ID
 *
 * @param paramName - Nombre del parámetro de ruta que contiene el resource ID
 *   Ej: 'id' (para /tags/:id, /alerts/:id)
 *   Ej: 'tagId' (para /tags/:tagId/subscribe)
 *
 * @example
 *   @Patch(':id')
 *   @ValidateOwnership('id')
 *   @UseGuards(OwnershipGuard)
 *   async updateTag(@Param('id') id: string) { ... }
 *   // Guard valida que userId está autenticado y 'id' existe
 *   // Service valida que userId es propietario de 'id'
 */
export const ValidateOwnership = (paramName: string) =>
  SetMetadata('ownership_param', paramName);
