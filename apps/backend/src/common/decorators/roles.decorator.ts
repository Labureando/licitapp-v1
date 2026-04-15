import { SetMetadata } from '@nestjs/common';
import { Role } from '../../modules/users/enums';

/**
 * Decorador para especificar los roles requeridos para acceder a un endpoint
 * @param roles - Array de roles permitidos
 */
export const RequireRoles = (...roles: Role[]) =>
  SetMetadata('roles', roles);

/**
 * Decorador para especificar que solo SUPER_ADMIN puede acceder
 */
export const SuperAdminOnly = () =>
  SetMetadata('roles', [Role.SUPER_ADMIN]);

/**
 * Decorador para especificar que el usuario debe ser admin de su organización
 */
export const RequireOrgAdmin = () =>
  SetMetadata('roles', [Role.SUPER_ADMIN, Role.ORG_OWNER, Role.ORG_ADMIN]);

/**
 * Decorador para marcar que una ruta requiere autenticación básica (usuario activo)
 */
export const RequireAuth = () =>
  SetMetadata('requireAuth', true);
