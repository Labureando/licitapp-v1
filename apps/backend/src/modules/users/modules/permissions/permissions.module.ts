import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PlansModule } from '../plans/plans.module';

/**
 * Módulo de Permisos
 * Gestiona la lógica de autorización basada en roles y planes
 *
 * Proporciona:
 * - Evaluación de permisos (rol + plan)
 * - Validaciones de permisos
 * - Métodos de control de acceso
 */
@Module({
  imports: [PlansModule], // Para acceder a LimitsService
  providers: [PermissionsService],
  exports: [PermissionsService], // Exportar para que otros módulos lo usen
})
export class PermissionsModule {}
