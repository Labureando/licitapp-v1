import { Injectable } from '@nestjs/common';
import { OrganizationPlan, UserPlan } from '../../../enums';
import {
  ORGANIZATION_PLAN_LIMITS,
  USER_PLAN_LIMITS,
} from './limits.constants';
import {
  OrganizationPlanLimits,
  UserPlanLimits,
} from './limits.interface';

@Injectable()
export class LimitsService {
  // ==================== ORGANIZATION PLANS ====================

  /**
   * Obtiene los límites para un plan de organización
   */
  getOrganizationPlanLimits(
    plan: OrganizationPlan,
  ): OrganizationPlanLimits {
    return ORGANIZATION_PLAN_LIMITS[plan];
  }

  /**
   * Verifica si una organización puede agregar más usuarios
   */
  canAddUserToOrganization(
    plan: OrganizationPlan,
    currentUserCount: number,
  ): boolean {
    const limits = this.getOrganizationPlanLimits(plan);
    return currentUserCount < limits.maxUsers;
  }

  /**
   * Verifica si una organización puede crear más pipelines
   */
  canCreatePipelineInOrganization(
    plan: OrganizationPlan,
    currentPipelineCount: number,
  ): boolean {
    const limits = this.getOrganizationPlanLimits(plan);
    return currentPipelineCount < limits.maxPipelines;
  }

  /**
   * Verifica si una organización puede crear más alertas
   */
  canCreateAlertInOrganization(
    plan: OrganizationPlan,
    currentAlertCount: number,
  ): boolean {
    const limits = this.getOrganizationPlanLimits(plan);
    return currentAlertCount < limits.maxAlerts;
  }

  /**
   * Verifica si una organización tiene acceso a integraciones
   */
  orgHasIntegrations(plan: OrganizationPlan): boolean {
    const limits = this.getOrganizationPlanLimits(plan);
    return limits.hasIntegrations;
  }

  /**
   * Verifica si una organización tiene acceso a workflows
   */
  orgHasWorkflows(plan: OrganizationPlan): boolean {
    const limits = this.getOrganizationPlanLimits(plan);
    return limits.hasWorkflows;
  }

  /**
   * Verifica si una organización tiene acceso al histórico
   */
  orgHasHistoricalAccess(plan: OrganizationPlan): boolean {
    const limits = this.getOrganizationPlanLimits(plan);
    return limits.hasHistoricalAccess;
  }

  // ==================== USER PLANS ====================

  /**
   * Obtiene los límites para un plan de usuario común (PUBLIC_USER)
   */
  getUserPlanLimits(plan: UserPlan): UserPlanLimits {
    return USER_PLAN_LIMITS[plan];
  }

  /**
   * Obtiene los tokens disponibles para un usuario este mes
   */
  getUserTokensPerMonth(plan: UserPlan): number {
    const limits = this.getUserPlanLimits(plan);
    return limits.tokensPerMonth;
  }

  /**
   * Verifica si un usuario puede crear alertas personalizadas
   */
  userCanCreateAlerts(plan: UserPlan): boolean {
    const limits = this.getUserPlanLimits(plan);
    return limits.canCreateAlerts;
  }

  /**
   * Verifica si un usuario tiene acceso al histórico
   */
  userHasHistoricalAccess(plan: UserPlan): boolean {
    const limits = this.getUserPlanLimits(plan);
    return limits.hasHistoricalAccess;
  }

  /**
   * Obtiene la cantidad máxima de búsquedas guardadas
   */
  getMaxSavedSearches(plan: UserPlan): number {
    const limits = this.getUserPlanLimits(plan);
    return limits.maxSavedSearches;
  }

  /**
   * Verifica si un usuario tiene acceso a filtros avanzados
   */
  userHasAdvancedFilters(plan: UserPlan): boolean {
    const limits = this.getUserPlanLimits(plan);
    return limits.hasAdvancedFilters;
  }
}
