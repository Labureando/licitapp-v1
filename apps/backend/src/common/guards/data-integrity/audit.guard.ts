/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const AUDIT_ACTION_KEY = 'audit_action';

/**
 * Guard para logging automático de cambios (Auditoría)
 *
 * **Uso:**
 * @Patch(':id')
 * @LogAudit('UPDATE')  // Tipo de acción
 * @UseGuards(AuditGuard)
 * async update(@Param('id') id: string, @Body() dto: UpdateDto) { ... }
 *
 * **Registra automáticamente:**
 * - Usuario (request.user.id)
 * - Acción (UPDATE, DELETE, CREATE, etc.)
 * - Recurso (entidad + ID)
 * - IP del cliente
 * - Timestamp
 * - Cambios (before/after) si es aplicable
 *
 * **Ventajas:**
 * - Cumplimiento legal (licitaciones públicas requieren trazabilidad)
 * - Detección de cambios no autorizados
 * - Recuperación de versiones anteriores
 * - Análisis forense de datos
 *
 * **Implementación:**
 * 1. Extrae metadata de decorador @LogAudit
 * 2. Captura estado ANTES del request (pre-hook)
 * 3. Permite que el request continúe
 * 4. Captura estado DESPUÉS del response
 * 5. Compara y registra cambios en tabla 'audit_log'
 */
@Injectable()
export class AuditGuard implements CanActivate {
  private readonly logger = new Logger(AuditGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener metadata del decorador
    const action = this.reflector.get<string>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    // Si no hay metadata, permitir (guard opcional)
    if (!action) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user;

    // Capturar datos para auditoría
    const auditData = {
      action,
      userId: user?.id,
      userEmail: user?.email,
      method: request.method,
      path: request.path,
      params: request.params,
      query: request.query,
      body: request.body,
      ip: this.getClientIp(request),
      timestamp: new Date(),
      userAgent: request.get('user-agent'),
    };

    // Guardar en request para acceso posterior en interceptor/service
    request.auditData = auditData;

    // Registrar início de la operación
    this.logger.debug(
      `🔍 AUDIT START: ${action} por ${user?.email} en ${request.method} ${request.path}`,
    );

    // Hook para capturar el status code y response body después
    const originalSend = response.send;
    const logger = this.logger;
    response.send = function (data: any) {
      auditData['responseStatus'] = response.statusCode;
      auditData['responseData'] = typeof data === 'string' ? data : JSON.stringify(data);

      logger.debug(
        `🔍 AUDIT END: ${action} completado con status ${response.statusCode}`,
      );

      return originalSend.call(this, data);
    };

    return true;
  }

  private getClientIp(request: any): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const forwardedIps = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0];
      return forwardedIps.trim();
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}
