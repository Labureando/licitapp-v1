/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, OrganizationEntity } from '../../modules/users/entities';
import { PermissionsService } from '../../modules/users/modules/permissions';

/**
 * Guard genérico para verificar permisos basados en rol + plan
 * Se usa para validaciones más complejas que no caben en RoleGuard o PlanGuard
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    @InjectRepository(OrganizationEntity)
    private organizationsRepository: Repository<OrganizationEntity>,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserEntity = request.user;

    // Validar que existe el usuario
    if (!user) {
      this.logger.warn('PermissionsGuard: Usuario no encontrado en request');
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Validar que el usuario está activo
    if (!user.isActive) {
      this.logger.warn(`PermissionsGuard: Usuario ${user.email} desactivado`);
      throw new ForbiddenException('Usuario desactivado');
    }

    // Si el usuario es SUPER_ADMIN, siempre permitir
    if (this.permissionsService.isSuperAdmin(user)) {
      return true;
    }

    // Para otros roles, validar que pertenece a una organización
    if (!user.organizationId) {
      this.logger.warn(
        `PermissionsGuard: Usuario ${user.email} no pertenece a organización`,
      );
      throw new ForbiddenException('Usuario debe pertenecer a una organización');
    }

    // Obtener organización
    const organization = await this.organizationsRepository.findOne({
      where: { id: user.organizationId },
    });

    if (!organization) {
      this.logger.warn(
        `PermissionsGuard: Organización ${user.organizationId} no encontrada`,
      );
      throw new ForbiddenException('Organización no encontrada');
    }

    // Guardar organización en request para uso posterior
    request.organization = organization;

    return true;
  }
}
