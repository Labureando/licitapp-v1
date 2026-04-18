import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ResourceExistsGuard, RESOURCE_EXISTS_KEY, RESOURCE_ENTITY_KEY } from '../guards/resource/resource-exists.guard';
import { SoftDeleteGuard } from '../guards/resource/soft-delete.guard';
import { AuditGuard, AUDIT_ACTION_KEY } from '../guards/data-integrity/audit.guard';
import { ConcurrencyGuard, CONCURRENCY_CHECK_KEY } from '../guards/data-integrity/concurrency.guard';

/**
 * Decorador compuesto para validar existencia de recursos
 *
 * Aplica automáticamente:
 * 1. SetMetadata para parámetro a validar
 * 2. SetMetadata para entity a buscar
 * 3. @UseGuards(ResourceExistsGuard)
 * 4. @ApiResponse (404 Not Found)
 *
 * @param entity - Clase Entity (ej: LicitacionEntity)
 * @param paramName - Nombre del parámetro en ruta (ej: 'id')
 *
 * @example
 *   @Get(':id')
 *   @ValidateResourceExists(LicitacionEntity, 'id')
 *   async getOne(@Param('id') id: string) { }
 *
 * **Ventajas:**
 * - Fail-fast: 404 temprano
 * - 1 línea vs 3 decoradores
 * - Documentación automática
 */
export const ValidateResourceExists = (entity: any, paramName: string) =>
  applyDecorators(
    SetMetadata(RESOURCE_EXISTS_KEY, paramName),
    SetMetadata(RESOURCE_ENTITY_KEY, entity),
    UseGuards(ResourceExistsGuard),
    ApiResponse({
      status: 404,
      description: `${entity?.name || 'Resource'} no encontrado`,
    }),
  );

/**
 * Decorador compuesto para habilitar soft delete filtering
 *
 * Aplica automáticamente:
 * 1. @UseGuards(SoftDeleteGuard)
 * 2. @ApiResponse (200 - sin eliminados)
 *
 * **Comportamiento:**
 * - Oculta registros con deletedAt !== NULL
 * - Agrega WHERE deletedAt IS NULL automáticamente
 * - No expone datos "eliminados" al cliente
 *
 * @example
 *   @Get()
 *   @EnableSoftDelete()
 *   async list() { }
 *
 * **Casos de uso:**
 * - Licitaciones eliminadas lógicamente
 * - Alertas desactivadas
 * - Usuarios inactivos (sin mostrar)
 */
export const EnableSoftDelete = () =>
  applyDecorators(
    UseGuards(SoftDeleteGuard),
    ApiResponse({
      status: 200,
      description: 'Registros activos solamente (eliminados ocultados)',
    }),
  );

/**
 * Decorador compuesto para logging de auditoría
 *
 * Aplica automáticamente:
 * 1. SetMetadata para tipo de acción
 * 2. @UseGuards(AuditGuard)
 * 3. @ApiResponse (documentación)
 *
 * @param action - Tipo de acción: 'CREATE', 'UPDATE', 'DELETE', 'READ' o personalizado (ej: 'ALERT_CREATE', 'TAG_UPDATE')
 *
 * @example
 *   @Post()
 *   @LogAuditAction('ALERT_CREATE')
 *   async create(@Body() dto: CreateDto) { }
 *
 *   @Patch(':id')
 *   @LogAuditAction('ALERT_UPDATE')
 *   async update(@Param('id') id: string) { }
 *
 * **Registra automáticamente:**
 * - Usuario (request.user.id)
 * - Acción (CREATE, UPDATE, DELETE, o custom)
 * - Recurso (entidad + ID)
 * - IP del cliente
 * - Timestamp
 * - Status code
 *
 * **Ventajas:**
 * - Cumplimiento legal (licitaciones públicas)
 * - Detección de cambios no autorizados
 * - Recuperación de versiones
 * - Análisis forense
 *
 * **Nota:** Los datos se guardan en tabla 'audit_log' via interceptor
 */
export const LogAuditAction = (action: string) =>
  applyDecorators(
    SetMetadata(AUDIT_ACTION_KEY, action),
    UseGuards(AuditGuard),
    ApiResponse({
      status: 200,
      description: `Operación ${action} registrada en auditoría`,
    }),
  );

/**
 * Decorador compuesto para control de concurrencia (optimista locking)
 *
 * Aplica automáticamente:
 * 1. SetMetadata para campo de versión
 * 2. @UseGuards(ConcurrencyGuard)
 * 3. @ApiResponse (409 Conflict)
 *
 * @param versionField - Campo en body con versión (ej: 'version')
 *
 * @example
 *   @Patch(':id')
 *   @ValidateConcurrency('version')
 *   async update(
 *     @Param('id') id: string,
 *     @Body() dto: UpdateDto,  // Debe incluir: { ..., version: 5 }
 *   ) { }
 *
 * **Flujo:**
 * 1. Cliente lee recurso (version = 1)
 * 2. Otro cliente actualiza → version = 2
 * 3. Primer cliente intenta update con version 1 → 409 Conflict
 * 4. Cliente recarga datos y reintenta
 *
 * **Previene:**
 * - Lost updates
 * - Sobrescrituras accidentales
 * - Inconsistencias de datos
 *
 * **Ventajas:**
 * - Sin locks explícitos (sin bloqueos)
 * - Escalable en múltiples instancias
 * - Cumple ACID
 *
 * **Nota:** BD debe tener columna 'version INT DEFAULT 1'
 */
export const ValidateConcurrency = (versionField: string) =>
  applyDecorators(
    SetMetadata(CONCURRENCY_CHECK_KEY, versionField),
    UseGuards(ConcurrencyGuard),
    ApiResponse({
      status: 409,
      description: 'Conflict: recurso fue modificado por otro usuario. Recarga e intenta de nuevo.',
    }),
  );

/**
 * Decorador compuesto para endpoints de lectura segura con soft delete
 *
 * Combina:
 * 1. @ValidateResourceExists (si hay ID en ruta)
 * 2. @EnableSoftDelete (oculta eliminados)
 * 3. @LogAuditAction('READ')
 *
 * @example
 *   @Get(':id')
 *   @SecureReadEndpoint(LicitacionEntity, 'id')
 *   async getOne(@Param('id') id: string) { }
 *
 * **Útil para:**
 * - GET /resource/:id
 * - GET /resource (listar sin eliminados)
 */
export const SecureReadEndpoint = (entity?: any, paramName?: string) => {
  const decorators: MethodDecorator[] = [
    LogAuditAction('READ'),
    EnableSoftDelete(),
  ];

  if (entity && paramName) {
    decorators.unshift(ValidateResourceExists(entity, paramName));
  }

  return applyDecorators(...decorators);
};

/**
 * Decorador compuesto para endpoints de actualización segura
 *
 * Combina:
 * 1. @ValidateResourceExists (valida que existe)
 * 2. @ValidateConcurrency (previene race conditions)
 * 3. @LogAuditAction('UPDATE')
 *
 * @example
 *   @Patch(':id')
 *   @SecureUpdateEndpoint(LicitacionEntity, 'id', 'version')
 *   async update(
 *     @Param('id') id: string,
 *     @Body() dto: UpdateDto,  // Debe incluir version
 *   ) { }
 *
 * **Protege contra:**
 * - Recursos inexistentes (404)
 * - Cambios simultáneos (409)
 * - Cambios no auditados
 */
export const SecureUpdateEndpoint = (entity: any, paramName: string, versionField: string) =>
  applyDecorators(
    ValidateResourceExists(entity, paramName),
    ValidateConcurrency(versionField),
    LogAuditAction('UPDATE'),
  );

/**
 * Decorador compuesto para endpoints de eliminación segura
 *
 * Combina:
 * 1. @ValidateResourceExists (valida que existe)
 * 2. @LogAuditAction('DELETE')
 *
 * @example
 *   @Delete(':id')
 *   @SecureDeleteEndpoint(LicitacionEntity, 'id')
 *   async delete(@Param('id') id: string) { }
 *
 * **Protege contra:**
 * - Recursos inexistentes (404)
 * - Eliminaciones no auditadas
 */
export const SecureDeleteEndpoint = (entity: any, paramName: string) =>
  applyDecorators(
    ValidateResourceExists(entity, paramName),
    LogAuditAction('DELETE'),
  );
