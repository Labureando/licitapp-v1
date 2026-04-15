/**
 * Interfaz para definir permisos basados en rol del usuario
 */
export interface RolePermission {
  canManageUsers: boolean;
  canManageLicitaciones: boolean;
  canViewAnalytics: boolean;
  canManagePlan: boolean;
}

/**
 * Interfaz para permisos basados en plan de organización
 */
export interface OrganizationPlanPermission {
  canCreatePipelines: boolean;
  canCreateAlerts: boolean;
  canUseIntegrations: boolean;
  canUseWorkflows: boolean;
  canAccessHistorical: boolean;
}

/**
 * Interfaz para permisos basados en plan de usuario común (PUBLIC_USER)
 */
export interface UserPlanPermission {
  canCreateAlerts: boolean;
  canAccessHistorical: boolean;
  hasAdvancedSearch: boolean;
  hasAdvancedFilters: boolean;
}

/**
 * Interfaz para permisos combinados (rol + plan)
 * Combina tanto permisos de rol como de plan (organización o usuario)
 */
export interface CombinedPermission
  extends RolePermission,
    OrganizationPlanPermission,
    UserPlanPermission {
  isActive: boolean;
  belongsToOrganization: boolean;
}

/**
 * Interfaz para resultado de validación de permisos
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}
