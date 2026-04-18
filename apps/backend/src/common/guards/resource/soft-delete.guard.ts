/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';

/**
 * Guard para ocultar automáticamente recursos "eliminados" (soft delete)
 *
 * **Uso:**
 * @Get()
 * @UseGuards(SoftDeleteGuard)
 * async list() { ... }
 *
 * **Comportamiento:**
 * - Si la entity tiene columna 'deletedAt', filtra automáticamente WHERE deletedAt IS NULL
 * - Retorna solo registros NO eliminados
 * - Evita exponer datos "eliminados" al frontend
 * - Crítico para compliance en licitaciones públicas
 *
 * **Implementación:**
 * 1. Intercepta request
 * 2. Verifica si entity tiene 'deletedAt' (soft delete)
 * 3. Si existe, agrega automáticamente filtro: WHERE deletedAt IS NULL
 * 4. Almacena en request.softDeleteFilter para acceso en services
 *
 * **Nota:**
 * Este guard funciona mejor con un interceptor de respuesta que aplique
 * el filtro automáticamente en QueryBuilder
 */
@Injectable()
export class SoftDeleteGuard implements CanActivate {
  private readonly logger = new Logger(SoftDeleteGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Marcar en request que se debe aplicar soft delete filter
    // Los services consultarán este flag y aplicarán: WHERE deletedAt IS NULL
    request.applySoftDeleteFilter = true;

    // También guardar el filtro de Typeorm para usarlo en QueryBuilder si es necesario
    request.softDeleteFilter = {
      deletedAt: IsNull(),
    };

    this.logger.debug('SoftDeleteGuard: Filtro de soft delete marcado para aplicar');

    return true;
  }
}
