/**
 * Límites Unificados para Planes
 * Se aplica tanto a organizaciones como a usuarios individuales (PUBLIC_USER)
 * Basado en roles-y-planes.md
 */
export interface PlanLimits {
  // === Límites de Organización ===
  maxUsers: number; // Cantidad de usuarios que puede agregar
  maxAlerts: number; // Alertas simultáneas
  maxPipelines: number; // Pipelines de procesamiento
  hasIntegrations: boolean; // Acceso a integraciones (Slack, CRM, etc)
  hasWorkflows: boolean; // Workflows personalizados
  hasHistoricalAccess: boolean; // Acceso al histórico de adjudicaciones

  // === Límites de Usuario (PUBLIC_USER) ===
  tokensPerMonth: number; // Tokens/créditos para búsquedas y IA
  canCreateAlerts: boolean; // Permite crear alertas personalizadas
  maxSavedSearches: number; // Búsquedas guardadas
  hasAdvancedFilters: boolean; // Filtros avanzados
}

/**
 * @deprecated Usar PlanLimits
 */
export interface OrganizationPlanLimits {
  maxUsers: number;
  maxAlerts: number;
  maxPipelines: number;
  hasIntegrations: boolean;
  hasWorkflows: boolean;
  hasHistoricalAccess: boolean;
}

/**
 * @deprecated Usar PlanLimits
 */
export interface UserPlanLimits {
  tokensPerMonth: number;
  canCreateAlerts: boolean;
  hasHistoricalAccess: boolean;
  maxSavedSearches: number;
  hasAdvancedFilters: boolean;
}
