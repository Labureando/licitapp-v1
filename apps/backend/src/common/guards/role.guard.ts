/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../modules/users/enums';

/**
 * Guard para verificar que el usuario tiene los roles requeridos
 * Se usa con el decorador @RequireRoles(Role.ORG_OWNER, Role.ORG_MEMBER)
 */
@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorador
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Validar que existe el usuario
    if (!user) {
      this.logger.warn('RoleGuard: Usuario no encontrado en request');
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Validar que el usuario está activo
    if (!user.isActive) {
      this.logger.warn(`RoleGuard: Usuario ${user.email} desactivado`);
      throw new ForbiddenException('Usuario desactivado');
    }

    // Verificar si el usuario tiene uno de los roles requeridos
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      this.logger.warn(
        `RoleGuard: Usuario ${user.email} con rol ${user.role} no tiene permisos. Roles requeridos: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Rol insuficiente. Roles requeridos: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
