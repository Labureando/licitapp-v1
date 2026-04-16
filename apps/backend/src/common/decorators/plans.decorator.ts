import { SetMetadata } from '@nestjs/common';
import { Plan } from '../../modules/users/enums';

/**
 * Decorador para especificar los planes de organización requeridos para acceder a un endpoint
 * @param plans - Array de planes permitidos
 */
export const RequirePlans = (...plans: Plan[]) =>
  SetMetadata('plans', plans);

/**
 * Decorador para especificar que se requiere plan PRO o superior para usuarios individuales
 */
export const RequirePaidPlan = () =>
  SetMetadata('plans', [Plan.PRO, Plan.ADVANCED]);

/**
 * Decorador para especificar que se requiere plan PROFESSIONAL para organizaciones
 */
export const RequireEnterprise = () =>
  SetMetadata('plans', [Plan.PROFESSIONAL]);
