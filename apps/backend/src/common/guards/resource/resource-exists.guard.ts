/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';

export const RESOURCE_EXISTS_KEY = 'resource_exists';
export const RESOURCE_ENTITY_KEY = 'resource_entity';

/**
 * Guard para validar que un recurso existe en BD antes de operaciones
 *
 * **Uso:**
 * @Get(':id')
 * @ValidateResourceExists(LicitacionEntity, 'id')  // entity, paramName
 * @UseGuards(ResourceExistsGuard)
 * async getOne(@Param('id') id: string) { ... }
 *
 * **Ventajas:**
 * - Valida existencia temprana (fail-fast)
 * - Evita queries a BD en datos inexistentes
 * - Centraliza lógica de "404 temprano"
 * - Permite decoradores composables
 *
 * **Implementación:**
 * 1. Obtiene metadata: qué entity y qué parámetro validar
 * 2. Extrae el repositorio de la entity
 * 3. Consulta: SELECT 1 FROM entity WHERE id = ?
 * 4. Si no existe: lanza NotFoundException (404)
 * 5. Continúa si existe (guard idempotente sin metadata)
 */
@Injectable()
export class ResourceExistsGuard implements CanActivate {
  private readonly logger = new Logger(ResourceExistsGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener metadata del decorador
    const paramName = this.reflector.get<string>(
      RESOURCE_EXISTS_KEY,
      context.getHandler(),
    );
    const entity: any = this.reflector.get<any>(
      RESOURCE_ENTITY_KEY,
      context.getHandler(),
    );

    // Si no hay metadata, permitir (guard opcional)
    if (!paramName || !entity) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const resourceId = request.params[paramName];

    if (!resourceId) {
      throw new BadRequestException(
        `Parámetro requerido no encontrado: ${paramName}`,
      );
    }

    // Obtener repositorio de la entity
    const repository: Repository<any> = request.entityManager?.getRepository(entity);

    if (!repository) {
      const entityName = (entity?.name as string) || 'Unknown';
      this.logger.warn(
        `ResourceExistsGuard: No se pudo obtener repositorio para ${entityName}`,
      );
      throw new BadRequestException('Configuración de repositorio inválida');
    }

    // Validar existencia: SELECT 1 FROM entity WHERE id = ?
    const exists = await repository.findOne({
      where: { id: resourceId },
      select: ['id'], // Solo traer el ID para minimizar datos
    });

    if (!exists) {
      const entityName = (entity?.name as string) || 'Resource';
      this.logger.debug(
        `ResourceExistsGuard: Recurso ${entityName} con id ${resourceId} no encontrado`,
      );
      throw new NotFoundException(
        `${entityName} no encontrado: ${resourceId}`,
      );
    }

    // Guardar en request para acceso posterior en decoradores
    request.existingResource = exists;

    return true;
  }
}
