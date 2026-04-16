/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { Plan } from '../../../enums';
import { PLAN_LIMITS } from './limits.constants';
import { PlanLimits } from './limits.interface';

@Injectable()
export class LimitsService {
  /**
   * Obtiene los límites para un plan específico
   */
  getPlanLimits(plan: Plan): PlanLimits {
    return PLAN_LIMITS[plan];
  }

  // ==================== ORGANIZATION/PLAN CHECKS ====================

  /**
   * Verifica si una organización/plan puede agregar más usuarios
   */
  canAddUser(plan: Plan, currentUserCount: number): boolean {
    const limits = this.getPlanLimits(plan);
    return currentUserCount < limits.maxUsers;
  }

  /**
   * Verifica si una organización/plan puede crear más pipelines
   */
  canCreatePipeline(plan: Plan, currentPipelineCount: number): boolean {
    const limits = this.getPlanLimits(plan);
    return currentPipelineCount < limits.maxPipelines;
  }

  /**
   * Verifica si una organización/plan puede crear más alertas
   */
  canCreateAlert(plan: Plan, currentAlertCount: number): boolean {
    const limits = this.getPlanLimits(plan);
    return currentAlertCount < limits.maxAlerts;
  }

  /**
   * Verifica si tiene acceso a integraciones
   */
  hasIntegrations(plan: Plan): boolean {
    const limits = this.getPlanLimits(plan);
    return limits.hasIntegrations;
  }

  /**
   * Verifica si tiene acceso a workflows personalizados
   */
  hasWorkflows(plan: Plan): boolean {
    const limits = this.getPlanLimits(plan);
    return limits.hasWorkflows;
  }

  /**
   * Verifica si tiene acceso al histórico
   */
  hasHistoricalAccess(plan: Plan): boolean {
    const limits = this.getPlanLimits(plan);
    return limits.hasHistoricalAccess;
  }

  // ==================== USER PLAN CHECKS ====================

  /**
   * Obtiene los tokens disponibles por mes para un usuario
   */
  getTokensPerMonth(plan: Plan): number {
    const limits = this.getPlanLimits(plan);
    return limits.tokensPerMonth;
  }

  /**
   * Verifica si un usuario puede crear alertas personalizadas
   */
  canUserCreateAlerts(plan: Plan): boolean {
    const limits = this.getPlanLimits(plan);
    return limits.canCreateAlerts;
  }

  /**
   * Obtiene la cantidad máxima de búsquedas guardadas
   */
  getMaxSavedSearches(plan: Plan): number {
    const limits = this.getPlanLimits(plan);
    return limits.maxSavedSearches;
  }

  /**
   * Verifica si tiene acceso a filtros avanzados
   */
  hasAdvancedFilters(plan: Plan): boolean {
    const limits = this.getPlanLimits(plan);
    return limits.hasAdvancedFilters;
  }

  // ==================== DEPRECATED METHODS ====================

  /**
   * @deprecated Usar getPlanLimits
   */
  getOrganizationPlanLimits(plan: Plan) {
    return this.getPlanLimits(plan);
  }

  /**
   * @deprecated Usar canAddUser
   */
  canAddUserToOrganization(plan: Plan, currentUserCount: number): boolean {
    return this.canAddUser(plan, currentUserCount);
  }

  /**
   * @deprecated Usar canCreatePipeline
   */
  canCreatePipelineInOrganization(
    plan: Plan,
    currentPipelineCount: number,
  ): boolean {
    return this.canCreatePipeline(plan, currentPipelineCount);
  }

  /**
   * @deprecated Usar canCreateAlert
   */
  canCreateAlertInOrganization(
    plan: Plan,
    currentAlertCount: number,
  ): boolean {
    return this.canCreateAlert(plan, currentAlertCount);
  }

  /**
   * @deprecated Usar hasIntegrations
   */
  orgHasIntegrations(plan: Plan): boolean {
    return this.hasIntegrations(plan);
  }

  /**
   * @deprecated Usar hasWorkflows
   */
  orgHasWorkflows(plan: Plan): boolean {
    return this.hasWorkflows(plan);
  }

  /**
   * @deprecated Usar hasHistoricalAccess
   */
  orgHasHistoricalAccess(plan: Plan): boolean {
    return this.hasHistoricalAccess(plan);
  }

  /**
   * @deprecated Usar getPlanLimits
   */
  getUserPlanLimits(plan: Plan) {
    return this.getPlanLimits(plan);
  }

  /**
   * @deprecated Usar getTokensPerMonth
   */
  getUserTokensPerMonth(plan: Plan): number {
    return this.getTokensPerMonth(plan);
  }

  /**
   * @deprecated Usar canUserCreateAlerts
   */
  userCanCreateAlerts(plan: Plan): boolean {
    return this.canUserCreateAlerts(plan);
  }

  /**
   * @deprecated Usar hasHistoricalAccess
   */
  userHasHistoricalAccess(plan: Plan): boolean {
    return this.hasHistoricalAccess(plan);
  }

  /**
   * @deprecated Usar hasAdvancedFilters
   */
  userHasAdvancedFilters(plan: Plan): boolean {
    return this.hasAdvancedFilters(plan);
  }
}
