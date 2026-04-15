import { Injectable, Logger } from '@nestjs/common';
import { UserEntity, OrganizationEntity } from '../../entities';
import { Role, OrganizationPlan, UserPlan } from '../../enums';
import { LimitsService } from '../plans/limits/limits.service';
import {
  RolePermission,
  OrganizationPlanPermission,
  UserPlanPermission,
  CombinedPermission,
  PermissionCheckResult,
} from './permissions.interface';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly limitsService: LimitsService) {}

  /**
   * Obtener permisos basados en el rol del usuario
   * @param role - Rol del usuario
   * @returns Objeto con permisos basados en rol
   */
  getRolePermissions(role: Role): RolePermission {
    const rolePermissions: Record<Role, RolePermission> = {
      [Role.SUPER_ADMIN]: {
        canManageUsers: true,
        canManageLicitaciones: true,
        canViewAnalytics: true,
        canManagePlan: true,
      },
      [Role.ORG_OWNER]: {
        canManageUsers: true,
        canManageLicitaciones: true,
        canViewAnalytics: true,
        canManagePlan: true,
      },
      [Role.ORG_ADMIN]: {
        canManageUsers: true,
        canManageLicitaciones: true,
        canViewAnalytics: true,
        canManagePlan: false,
      },
      [Role.ORG_MEMBER]: {
        canManageUsers: false,
        canManageLicitaciones: true,
        canViewAnalytics: false,
        canManagePlan: false,
      },
      [Role.ORG_VIEWER]: {
        canManageUsers: false,
        canManageLicitaciones: false,
        canViewAnalytics: true,
        canManagePlan: false,
      },
      [Role.PUBLIC_USER]: {
        canManageUsers: false,
        canManageLicitaciones: false,
        canViewAnalytics: false,
        canManagePlan: false,
      },
    };

    return rolePermissions[role];
  }

  /**
   * Obtener permisos basados en el plan de la organización
   * @param plan - Plan de la organización
   * @returns Objeto con permisos basados en plan
   */
  getOrganizationPlanPermissions(
    plan: OrganizationPlan,
  ): OrganizationPlanPermission {
    const planPermissions: Record<
      OrganizationPlan,
      OrganizationPlanPermission
    > = {
      [OrganizationPlan.STARTER]: {
        canCreatePipelines: false,
        canCreateAlerts: true,
        canUseIntegrations: false,
        canUseWorkflows: false,
        canAccessHistorical: false,
      },
      [OrganizationPlan.PROFESSIONAL]: {
        canCreatePipelines: true,
        canCreateAlerts: true,
        canUseIntegrations: true,
        canUseWorkflows: true,
        canAccessHistorical: true,
      },
    };

    return planPermissions[plan];
  }

  /**
   * Obtener permisos basados en el plan del usuario común
   * @param plan - Plan del usuario (PUBLIC_USER)
   * @returns Objeto con permisos basados en plan de usuario
   */
  getUserPlanPermissions(plan: UserPlan): UserPlanPermission {
    const userPlanPerms: Record<UserPlan, UserPlanPermission> = {
      [UserPlan.FREE]: {
        canCreateAlerts: false,
        canAccessHistorical: false,
        hasAdvancedSearch: false,
        hasAdvancedFilters: false,
      },
      [UserPlan.PREMIUM]: {
        canCreateAlerts: true,
        canAccessHistorical: true,
        hasAdvancedSearch: true,
        hasAdvancedFilters: true,
      },
    };

    return userPlanPerms[plan];
  }

  /**
   * Obtener permisos combinados (rol + plan)
   * @param user - Entidad de usuario
   * @param organization - Entidad de organización
   * @returns Permisos combinados
   */
  getCombinedPermissions(
    user: UserEntity,
    organization?: OrganizationEntity,
  ): CombinedPermission {
    const rolePerms = this.getRolePermissions(user.role);

    let planPerms: any = {};
    if (organization) {
      planPerms = this.getOrganizationPlanPermissions(organization.plan);
    } else if (user.role === Role.PUBLIC_USER && user.userPlan) {
      planPerms = this.getUserPlanPermissions(user.userPlan);
    }

    return {
      ...rolePerms,
      ...planPerms,
      isActive: user.isActive,
      belongsToOrganization: !!user.organizationId,
    };
  }

  // ============ MÉTODOS DE VALIDACIÓN - USUARIOS EN ORGANIZACIONES ============

  /**
   * Verificar si el usuario puede gestionar otros usuarios (rol-based)
   * @param user - Usuario a verificar
   * @returns true si puede gestionar usuarios
   */
  canManageUsers(user: UserEntity): boolean {
    return [Role.SUPER_ADMIN, Role.ORG_OWNER, Role.ORG_ADMIN].includes(
      user.role,
    );
  }

  /**
   * Verificar si el usuario puede gestionar licitaciones (rol-based)
   * @param user - Usuario a verificar
   * @returns true si puede gestionar licitaciones
   */
  canManageLicitaciones(user: UserEntity): boolean {
    return [
      Role.SUPER_ADMIN,
      Role.ORG_OWNER,
      Role.ORG_ADMIN,
      Role.ORG_MEMBER,
    ].includes(user.role);
  }

  /**
   * Verificar si el usuario puede ver analytics (rol-based)
   * @param user - Usuario a verificar
   * @returns true si puede ver analytics
   */
  canViewAnalytics(user: UserEntity): boolean {
    return [
      Role.SUPER_ADMIN,
      Role.ORG_OWNER,
      Role.ORG_ADMIN,
      Role.ORG_VIEWER,
    ].includes(user.role);
  }

  /**
   * Verificar si el usuario puede cambiar el plan de la organización
   * @param user - Usuario a verificar
   * @returns true si puede cambiar plan
   */
  canManagePlan(user: UserEntity): boolean {
    return [Role.SUPER_ADMIN, Role.ORG_OWNER].includes(user.role);
  }

  // ============ MÉTODOS DE VALIDACIÓN - PLANES DE ORGANIZACIÓN ============

  /**
   * Verificar si la organización puede crear pipelines
   * @param organization - Organización a verificar
   * @returns true si puede crear pipelines
   */
  canCreatePipeline(organization: OrganizationEntity): boolean {
    return organization.plan === OrganizationPlan.PROFESSIONAL;
  }

  /**
   * Verificar si la organización puede crear alertas
   * @param organization - Organización a verificar
   * @returns true si puede crear alertas
   */
  canCreateAlert(organization: OrganizationEntity): boolean {
    return [
      OrganizationPlan.STARTER,
      OrganizationPlan.PROFESSIONAL,
    ].includes(organization.plan);
  }

  /**
   * Verificar si la organización puede usar integraciones
   * @param organization - Organización a verificar
   * @returns true si puede usar integraciones
   */
  canUseIntegrations(organization: OrganizationEntity): boolean {
    return organization.plan === OrganizationPlan.PROFESSIONAL;
  }

  /**
   * Verificar si la organización puede usar workflows personalizados
   * @param organization - Organización a verificar
   * @returns true si puede usar workflows
   */
  canUseWorkflows(organization: OrganizationEntity): boolean {
    return organization.plan === OrganizationPlan.PROFESSIONAL;
  }

  /**
   * Verificar si la organización puede acceder a histórico
   * @param organization - Organización a verificar
   * @returns true si puede acceder a histórico
   */
  canAccessHistorical(organization: OrganizationEntity): boolean {
    return organization.plan === OrganizationPlan.PROFESSIONAL;
  }

  // ============ MÉTODOS DE VALIDACIÓN - PLANES DE USUARIO ============

  /**
   * Verificar si el usuario común puede crear alertas personalizadas
   * @param user - Usuario a verificar (debe ser PUBLIC_USER)
   * @returns true si puede crear alertas
   */
  userCanCreateAlerts(user: UserEntity): boolean {
    if (user.role !== Role.PUBLIC_USER || !user.userPlan) {
      return false;
    }
    return this.limitsService.userCanCreateAlerts(user.userPlan);
  }

  /**
   * Verificar si el usuario común tiene acceso al histórico
   * @param user - Usuario a verificar (debe ser PUBLIC_USER)
   * @returns true si tiene acceso
   */
  userCanAccessHistorical(user: UserEntity): boolean {
    if (user.role !== Role.PUBLIC_USER || !user.userPlan) {
      return false;
    }
    return this.limitsService.userHasHistoricalAccess(user.userPlan);
  }

  /**
   * Obtener tokens disponibles para un usuario común este mes
   * @param user - Usuario a verificar (debe ser PUBLIC_USER)
   * @returns Cantidad de tokens disponibles
   */
  getUserTokensPerMonth(user: UserEntity): number {
    if (user.role !== Role.PUBLIC_USER || !user.userPlan) {
      return 0;
    }
    return this.limitsService.getUserTokensPerMonth(user.userPlan);
  }

  /**
   * Obtener máximo de búsquedas guardadas para un usuario
   * @param user - Usuario a verificar (debe ser PUBLIC_USER)
   * @returns Cantidad máxima de búsquedas guardadas
   */
  getMaxSavedSearches(user: UserEntity): number {
    if (user.role !== Role.PUBLIC_USER || !user.userPlan) {
      return 0;
    }
    return this.limitsService.getMaxSavedSearches(user.userPlan);
  }

  // ============ MÉTODOS VERIFICACIÓN DE ROL ============

  /**
   * Verificar si el usuario es SUPER_ADMIN
   * @param user - Usuario a verificar
   * @returns true si es SUPER_ADMIN
   */
  isSuperAdmin(user: UserEntity): boolean {
    return user.role === Role.SUPER_ADMIN;
  }

  /**
   * Verificar si el usuario es propietario de la organización
   * @param user - Usuario a verificar
   * @returns true si es ORG_OWNER
   */
  isOrgOwner(user: UserEntity): boolean {
    return user.role === Role.ORG_OWNER;
  }

  /**
   * Verificar si el usuario es admin de la organización
   * @param user - Usuario a verificar
   * @returns true si es ORG_OWNER o ORG_ADMIN
   */
  isOrgAdmin(user: UserEntity): boolean {
    return [Role.ORG_OWNER, Role.ORG_ADMIN].includes(user.role);
  }

  /**
   * Verificar si el usuario tiene rol de solo lectura
   * @param user - Usuario a verificar
   * @returns true si es ORG_VIEWER o PUBLIC_USER
   */
  isReadOnly(user: UserEntity): boolean {
    return [Role.ORG_VIEWER, Role.PUBLIC_USER].includes(user.role);
  }

  /**
   * Verificar si el usuario es un usuario público sin organización
   * @param user - Usuario a verificar
   * @returns true si es PUBLIC_USER sin organizationId
   */
  isPublicUser(user: UserEntity): boolean {
    return user.role === Role.PUBLIC_USER && !user.organizationId;
  }

  // ============ MÉTODOS DE VALIDACIÓN GENERAL ============

  /**
   * Validar que el usuario pertenece a la organización
   * Excepción: SUPER_ADMIN no pertenece a ninguna organización
   * @param user - Usuario a verificar
   * @param organizationId - ID de la organización
   * @returns Resultado de validación
   */
  validateUserBelongsToOrganization(
    user: UserEntity,
    organizationId: string,
  ): PermissionCheckResult {
    // SUPER_ADMIN puede acceder a cualquier organización
    if (user.role === Role.SUPER_ADMIN) {
      return { allowed: true };
    }

    // Para otros roles, debe pertenecer a la organización
    if (user.organizationId !== organizationId) {
      return {
        allowed: false,
        reason: 'Usuario no pertenece a esta organización',
      };
    }

    return { allowed: true };
  }

  /**
   * Validar que el usuario está activo
   * @param user - Usuario a verificar
   * @returns Resultado de validación
   */
  validateUserIsActive(user: UserEntity): PermissionCheckResult {
    if (!user.isActive) {
      return {
        allowed: false,
        reason: 'Usuario desactivado',
      };
    }

    return { allowed: true };
  }

  /**
   * Validar conjunto completo de permisos para una acción
   * @param user - Usuario a verificar
   * @param organization - Organización a verificar
   * @param requiredPermissions - Permisos requeridos como array de nombres
   * @returns Resultado de validación
   */
  validatePermissions(
    user: UserEntity,
    organization: OrganizationEntity,
    requiredPermissions: (keyof CombinedPermission)[],
  ): PermissionCheckResult {
    // Validar que el usuario está activo
    const activeCheck = this.validateUserIsActive(user);
    if (!activeCheck.allowed) {
      return activeCheck;
    }

    // Obtener permisos combinados
    const combinedPerms = this.getCombinedPermissions(user, organization);

    // Verificar que tiene todos los permisos requeridos
    for (const permission of requiredPermissions) {
      if (!combinedPerms[permission]) {
        return {
          allowed: false,
          reason: `Permiso requerido no disponible: ${String(permission)}`,
        };
      }
    }

    return { allowed: true };
  }
}

