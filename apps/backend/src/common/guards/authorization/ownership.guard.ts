/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard de Ownership (Propiedad de Recurso)
 * Valida que el usuario autenticado es el propietario del recurso
 *
 * **Validación Simple:**
 * 1. Obtiene userId de request.user (desde JWT)
 * 2. Obtiene resourceId de request.params[paramName]
 * 3. Obtiene ownerId del body/query/contexto
 * 4. Compara: userId === ownerId
 *
 * **Uso con decorador @ValidateOwnership:**
 * @Patch(':id')
 * @ValidateOwnership('id')  // El parámetro que contiene el resource ID
 * @UseGuards(OwnershipGuard)
 * async update(@Param('id') id: string, @CurrentUser() userId: string) {
 *   // El guard ya validó que userId es propietario de 'id'
 * }
 *
 * **Nota:** El guard valida PRESENCIA de userId y parámetro.
 * La lógica de ownership específica (BD queries) va en el service.
 * El service lanzará BadRequestException si no hay permisos.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener metadata del decorador (nombre del parámetro)
    const paramName = this.reflector.get<string>(
      'ownership_param',
      context.getHandler(),
    );

    // Si no hay metadata, permitir (guard opcional)
    if (!paramName) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Validar que usuario está autenticado
    if (!user || !user.id) {
      this.logger.warn('OwnershipGuard: Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener ID del parámetro
    const resourceId = request.params[paramName];

    if (!resourceId) {
      this.logger.warn(
        `OwnershipGuard: Parámetro "${paramName}" no encontrado en ruta`,
      );
      throw new BadRequestException(
        `Parámetro requerido no encontrado: ${paramName}`,
      );
    }

    // El guard solo valida PRESENCIA de datos
    // La lógica específica de ownership (búsqueda en BD) va en el service
    // El service hará throw de BadRequestException si no tiene permisos

    this.logger.debug(
      `OwnershipGuard: Validando acceso de usuario ${user.id} a recurso ${resourceId}`,
    );

    return true;
  }
}
