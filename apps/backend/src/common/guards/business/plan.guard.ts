/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../../../modules/users/enums';
import { OrganizationEntity } from '../../../modules/users/entities';

/**
 * Guard para verificar que la organización del usuario tiene los planes requeridos
 * Se usa con el decorador @RequirePlans(Plan.PRO)
 */
@Injectable()
export class PlanGuard implements CanActivate {
  private readonly logger = new Logger(PlanGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(OrganizationEntity)
    private organizationsRepository: Repository<OrganizationEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener los planes requeridos del decorador
    const requiredPlans = this.reflector.get<Plan[]>(
      'plans',
      context.getHandler(),
    );

    // Si no hay planes requeridos, permitir acceso
    if (!requiredPlans) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Validar que existe el usuario
    if (!user) {
      this.logger.warn('PlanGuard: Usuario no encontrado en request');
      throw new ForbiddenException('Usuario no autenticado');
    }

    // SUPER_ADMIN siempre tiene acceso (no pertenece a organización)
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Para otros roles, debe tener organización
    if (!user.organizationId) {
      this.logger.warn(
        `PlanGuard: Usuario ${user.email} no pertenece a organización`,
      );
      throw new ForbiddenException('Usuario debe pertenecer a una organización');
    }

    // Obtener la organización del usuario
    const organization = await this.organizationsRepository.findOne({
      where: { id: user.organizationId },
    });

    if (!organization) {
      this.logger.warn(
        `PlanGuard: Organización ${user.organizationId} no encontrada`,
      );
      throw new ForbiddenException('Organización no encontrada');
    }

    // Verificar si la organización tiene uno de los planes requeridos
    const hasPlan = requiredPlans.includes(organization.plan);

    if (!hasPlan) {
      this.logger.warn(
        `PlanGuard: Organización ${organization.id} con plan ${organization.plan} no tiene permisos. Planes requeridos: ${requiredPlans.join(', ')}`,
      );
      throw new ForbiddenException(
        `Plan insuficiente. Planes requeridos: ${requiredPlans.join(', ')}`,
      );
    }

    return true;
  }
}
