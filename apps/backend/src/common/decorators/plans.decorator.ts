import { SetMetadata } from '@nestjs/common';
import { OrganizationPlan } from '../../modules/users/enums';

/**
 * Decorador para especificar los planes de organización requeridos para acceder a un endpoint
 * @param plans - Array de planes permitidos
 */
export const RequirePlans = (...plans: OrganizationPlan[]) =>
  SetMetadata('plans', plans);

/**
 * Decorador para especificar que se requiere plan PROFESSIONAL (con todas las features)
 */
export const RequirePaidPlan = () =>
  SetMetadata('plans', [OrganizationPlan.PROFESSIONAL]);

/**
 * Decorador para especificar que se requiere plan PROFESSIONAL (con integraciones y workflows)
 */
export const RequireEnterprise = () =>
  SetMetadata('plans', [OrganizationPlan.PROFESSIONAL]);
