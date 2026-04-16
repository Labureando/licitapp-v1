/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { UserEntity, OrganizationEntity } from '../../entities';
import { Role, Plan } from '../../enums';
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
      [Role.ORG_MEMBER]: {
        canManageUsers: false,
        canManageLicitaciones: true,
        canViewAnalytics: true,
        canManagePlan: false,
      },
      [Role.PUBLIC_USER]: {
        canManageUsers: false,
        canManageLicitaciones: true,
        canViewAnalytics: false,
        canManagePlan: false,
      },
    };

    return rolePermissions[role];
  }

  /**
   * Obtener permisos basados en el plan
   * Diferencia entre planes de usuarios individuales y organizaciones
   * @param plan - Plan del usuario o organización
   * @returns Objeto con permisos basados en plan
   */
  getPlanPermissions(plan: Plan): OrganizationPlanPermission {
    // Planes de usuario individual (PUBLIC_USER)
    if ([Plan.FREE, Plan.PRO, Plan.ADVANCED].includes(plan)) {
      return this.getIndividualUserPlanPermissions(plan);
    }

    // Planes de organización
    return this.getOrgPlanPermissions(plan);
  }

  /**
   * Permisos para planes de usuarios individuales (PUBLIC_USER)
   */
  private getIndividualUserPlanPermissions(plan: Plan): OrganizationPlanPermission {
    const userPlans: Record<string, OrganizationPlanPermission> = {
      [Plan.FREE]: {
        canCreateAlerts: true,
        canCreatePipelines: false,
        canUseIntegrations: false,
        canUseWorkflows: false,
        canAccessHistorical: false,
      },
      [Plan.PRO]: {
        canCreateAlerts: true,
        canCreatePipelines: false,
        canUseIntegrations: false,
        canUseWorkflows: false,
        canAccessHistorical: true,
      },
      [Plan.ADVANCED]: {
        canCreateAlerts: true,
        canCreatePipelines: false,
        canUseIntegrations: false,
        canUseWorkflows: false,
        canAccessHistorical: true,
      },
    };

    return userPlans[plan];
  }

  /**
   * Permisos para planes de organizaciones
   */
  private getOrgPlanPermissions(plan: Plan): OrganizationPlanPermission {
    const orgPlans: Record<string, OrganizationPlanPermission> = {
      [Plan.STARTER]: {
        canCreateAlerts: true,
        canCreatePipelines: false,
        canUseIntegrations: false,
        canUseWorkflows: false,
        canAccessHistorical: true,
      },
      [Plan.PROFESSIONAL]: {
        canCreateAlerts: true,
        canCreatePipelines: false,
        canUseIntegrations: true,
        canUseWorkflows: false,
        canAccessHistorical: true,
      },
    };

    if (!orgPlans[plan]) {
      this.logger.warn(`Plan de organización no reconocido: ${plan}`);
      throw new Error(`Plan no válido para organización: ${plan}`);
    }

    return orgPlans[plan];
  }

  /**
   * @deprecated Usar getPlanPermissions
   */
  getOrganizationPlanPermissions(
    plan: Plan,
  ): OrganizationPlanPermission {
    return this.getPlanPermissions(plan);
  }

  /**
   * @deprecated Usar getPlanPermissions
   */
  getUserPlanPermissions(plan: Plan): UserPlanPermission {
    const perms = this.getPlanPermissions(plan);
    return {
      canCreateAlerts: perms.canCreateAlerts,
      canAccessHistorical: perms.canAccessHistorical,
      hasAdvancedSearch: perms.canUseIntegrations,
      hasAdvancedFilters: perms.canUseWorkflows,
    };
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
    return [Role.SUPER_ADMIN, Role.ORG_OWNER].includes(
      user.role,
    );
  }

  /**
   * Verificar si el usuario puede gestionar licitaciones (buscar, crear alertas, analizar)
   * @param user - Usuario a verificar
   * @returns true si puede gestionar licitaciones
   */
  canManageLicitaciones(user: UserEntity): boolean {
    return [
      Role.SUPER_ADMIN,
      Role.ORG_OWNER,
      Role.ORG_MEMBER,
      Role.PUBLIC_USER,
    ].includes(user.role);
  }

  /**
   * Verificar si el usuario puede ver analytics y reportes
   * @param user - Usuario a verificar
   * @returns true si puede ver analytics
   */
  canViewAnalytics(user: UserEntity): boolean {
    return [
      Role.SUPER_ADMIN,
      Role.ORG_OWNER,
      Role.ORG_MEMBER,
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
  /**
   * Verificar si la organización puede crear pipelines
   * Ningún plan de organización soporta pipelines por ahora
   * @returns false (pipelines no soportados)
   */
  canCreatePipeline(): boolean {
    // Ningún plan de organización soporta pipelines por ahora
    return false;
  }

  /**
   * Verificar si la organización puede crear alertas
   * @param organization - Organización a verificar
   * @returns true si puede crear alertas
   */
  canCreateAlert(organization: OrganizationEntity): boolean {
    // Ambos planes de organización (STARTER, PROFESSIONAL) pueden crear alertas
    return [Plan.STARTER, Plan.PROFESSIONAL].includes(organization.plan);
  }

  /**
   * Verificar si la organización puede usar integraciones
   * @param organization - Organización a verificar
   * @returns true si puede usar integraciones
   */
  canUseIntegrations(organization: OrganizationEntity): boolean {
    // Solo PROFESSIONAL tiene integraciones
    return organization.plan === Plan.PROFESSIONAL;
  }

  /**
   * Verificar si la organización puede usar workflows personalizados
   * Workflows no soportados aún en ningún plan
   * @returns false (workflows no soportados)
   */
  canUseWorkflows(): boolean {
    // Workflows no soportados aún en ningún plan
    return false;
  }

  /**
   * Verificar si la organización puede acceder a histórico
   * @param organization - Organización a verificar
   * @returns true si puede acceder a histórico
   */
  canAccessHistorical(organization: OrganizationEntity): boolean {
    // Ambos planes de organización pueden acceder a histórico
    return [Plan.STARTER, Plan.PROFESSIONAL].includes(organization.plan);
  }

  // ============ MÉTODOS DE VALIDACIÓN - PLANES DE USUARIO INDIVIDUAL ============

  /**
   * Verificar si el usuario individual (PUBLIC_USER) puede crear alertas
   * FREE: 1 alerta
   * PRO: 5 alertas
   * ADVANCED: 10 alertas
   * @param user - Usuario a verificar (debe ser PUBLIC_USER)
   * @returns true si puede crear alertas
   */
  userCanCreateAlerts(user: UserEntity): boolean {
    if (user.role !== Role.PUBLIC_USER || !user.userPlan) {
      return false;
    }

    // FREE permite crear alertas (hasta 1)
    // PRO permite crear alertas (hasta 5)
    // ADVANCED permite crear alertas (hasta 10)
    return [Plan.FREE, Plan.PRO, Plan.ADVANCED].includes(user.userPlan);
  }

  /**
   * Verificar si el usuario individual tiene acceso al histórico
   * FREE: 3 meses
   * PRO: 6 meses
   * ADVANCED: 1 año
   * @param user - Usuario a verificar (debe ser PUBLIC_USER)
   * @returns true si tiene acceso
   */
  userCanAccessHistorical(user: UserEntity): boolean {
    if (user.role !== Role.PUBLIC_USER || !user.userPlan) {
      return false;
    }

    // FREE no tiene acceso a histórico
    // PRO y ADVANCED sí tienen acceso
    return [Plan.PRO, Plan.ADVANCED].includes(user.userPlan);
  }

  /**
   * Obtener el límite de créditos IA para un usuario individual por mes
   * @param userPlan - Plan del usuario individual
   * @returns Cantidad de créditos disponibles
   */
  getAICreditsLimit(userPlan: Plan): number {
    const creditsByPlan: Record<string, number> = {
      [Plan.FREE]: 50,
      [Plan.PRO]: 500,
      [Plan.ADVANCED]: 1000,
    };

    return creditsByPlan[userPlan] || 0;
  }

  /**
   * Obtener el límite de alertas para un usuario individual
   * @param userPlan - Plan del usuario individual
   * @returns Cantidad de alertas permitidas
   */
  getAlertsLimit(userPlan: Plan): number {
    const alertsByPlan: Record<string, number> = {
      [Plan.FREE]: 1,
      [Plan.PRO]: 5,
      [Plan.ADVANCED]: 10,
    };

    return alertsByPlan[userPlan] || 0;
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

  // ============ MÉTODOS DE LÍMITES - ORGANIZACIONES ============

  /**
   * Obtener el límite de usuarios para una organización
   * STARTER: 3 usuarios
   * PROFESSIONAL: 10 usuarios
   * @param orgPlan - Plan de la organización
   * @returns Cantidad de usuarios permitidos
   */
  getOrganizationUsersLimit(orgPlan: Plan): number {
    const usersByPlan: Record<string, number> = {
      [Plan.STARTER]: 3,
      [Plan.PROFESSIONAL]: 10,
    };

    return usersByPlan[orgPlan] || 0;
  }

  /**
   * Obtener el límite de alertas para una organización
   * STARTER: 5 alertas
   * PROFESSIONAL: 15 alertas
   * @param orgPlan - Plan de la organización
   * @returns Cantidad de alertas permitidas
   */
  getOrganizationAlertsLimit(orgPlan: Plan): number {
    const alertsByPlan: Record<string, number> = {
      [Plan.STARTER]: 5,
      [Plan.PROFESSIONAL]: 15,
    };

    return alertsByPlan[orgPlan] || 0;
  }

  /**
   * Obtener créditos IA mensuales para una organización
   * STARTER: 500 créditos/mes
   * PROFESSIONAL: 5.000 créditos/mes
   * @param orgPlan - Plan de la organización
   * @returns Cantidad de créditos disponibles
   */
  getOrganizationAICreditsLimit(orgPlan: Plan): number {
    const creditsByPlan: Record<string, number> = {
      [Plan.STARTER]: 500,
      [Plan.PROFESSIONAL]: 5000,
    };

    return creditsByPlan[orgPlan] || 0;
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
   * Verificar si el usuario es admin de la organización (ORG_OWNER)
   * @param user - Usuario a verificar
   * @returns true si es ORG_OWNER
   */
  isOrgAdmin(user: UserEntity): boolean {
    return user.role === Role.ORG_OWNER;
  }

  /**
   * Verificar si el usuario tiene rol de solo lectura
   * @param user - Usuario a verificar
   * @returns true si es PUBLIC_USER
   */
  isReadOnly(user: UserEntity): boolean {
    return user.role === Role.PUBLIC_USER;
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

