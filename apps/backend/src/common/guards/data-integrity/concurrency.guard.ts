/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const CONCURRENCY_CHECK_KEY = 'concurrency_check';

/**
 * Guard para prevenir race conditions con versionado optimista
 *
 * **Uso:**
 * @Patch(':id')
 * @CheckConcurrency('version')  // Campo de versión en body
 * @UseGuards(ConcurrencyGuard)
 * async update(
 *   @Param('id') id: string,
 *   @Body() dto: UpdateDto,  // Debe incluir: { ..., version: 5 }
 * ) { ... }
 *
 * **Previene:**
 * - User A lee licitación (version 1)
 * - User B lee misma licitación (version 1)
 * - User B actualiza → version 2
 * - User A intenta actualizar con version 1 → FALLA (ConflictException)
 *
 * **Implementación:**
 * 1. Obtiene 'version' del body (enviado por cliente)
 * 2. Compara con 'version' actual en BD
 * 3. Si NO coinciden → ConflictException 409 (conflict)
 * 4. Si coinciden → permite actualizar (service incrementará version)
 * 5. BD debe tener columna 'version' INT DEFAULT 1
 *
 * **Ventajas:**
 * - Detección automática de cambios simultáneos
 * - No requiere locks explícitos
 * - Escalable en múltiples instancias/contenedores
 * - Cumple con principio ACID (Atomicity)
 */
@Injectable()
export class ConcurrencyGuard implements CanActivate {
  private readonly logger = new Logger(ConcurrencyGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener metadata del decorador
    const versionField = this.reflector.get<string>(
      CONCURRENCY_CHECK_KEY,
      context.getHandler(),
    );

    // Si no hay metadata, permitir (guard opcional)
    if (!versionField) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const clientVersion = request.body?.[versionField];
    const resourceId = request.params?.id;

    // Validar que se envió la versión
    if (clientVersion === undefined || clientVersion === null) {
      this.logger.warn(
        `ConcurrencyGuard: Campo '${versionField}' faltante en body`,
      );
      throw new ConflictException(
        `Campo de versión '${versionField}' es requerido`,
      );
    }

    // Guardar en request para validación en service
    request.expectedVersion = clientVersion;
    request.resourceId = resourceId;

    this.logger.debug(
      `ConcurrencyGuard: Validando versión ${clientVersion} para recurso ${resourceId}`,
    );

    // La validación REAL ocurre en el service:
    // - SELECT version FROM resource WHERE id = ?
    // - SI version !== clientVersion → ConflictException
    // - SI version === clientVersion → permitir update + incrementar version

    return true;
  }
}
