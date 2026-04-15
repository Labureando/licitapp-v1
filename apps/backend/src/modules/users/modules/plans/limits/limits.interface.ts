/**
 * Límites para Planes de Organización
 * Controla cuantos recursos colaborativos puede usar una organización
 */
export interface OrganizationPlanLimits {
  maxUsers: number; // Cantidad de usuarios que puede agregar
  maxAlerts: number; // Alertas simultáneas
  maxPipelines: number; // Pipelines de procesamiento
  hasIntegrations: boolean; // Acceso a integraciones (Slack, CRM, etc)
  hasWorkflows: boolean; // Workflows personalizados
  hasHistoricalAccess: boolean; // Acceso al histórico de adjudicaciones
}

/**
 * Límites para Planes de Usuario Común (PUBLIC_USER)
 * Controla recursos personales e individuales
 */
export interface UserPlanLimits {
  tokensPerMonth: number; // Tokens/créditos para búsquedas y IA
  canCreateAlerts: boolean; // Permite crear alertas personalizadas
  hasHistoricalAccess: boolean; // Acceso al histórico
  maxSavedSearches: number; // Búsquedas guardadas
  hasAdvancedFilters: boolean; // Filtros avanzados
}
