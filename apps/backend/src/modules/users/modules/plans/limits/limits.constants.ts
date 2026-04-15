import { OrganizationPlan, UserPlan } from '../../../enums';
import {
  OrganizationPlanLimits,
  UserPlanLimits,
} from './limits.interface';

/**
 * Límites para Planes de Organización
 * Dos opciones: STARTER (pequeño equipo) | PROFESSIONAL (equipos grandes)
 */
export const ORGANIZATION_PLAN_LIMITS: Record<
  OrganizationPlan,
  OrganizationPlanLimits
> = {
  [OrganizationPlan.STARTER]: {
    maxUsers: 5, // Hasta 5 usuarios en la organización
    maxAlerts: 3, // Alertas simultáneas por organización
    maxPipelines: 1, // 1 pipeline de procesamiento
    hasIntegrations: false, // Sin integraciones externas
    hasWorkflows: false, // Sin workflows personalizados
    hasHistoricalAccess: false, // Sin acceso al histórico
  },
  [OrganizationPlan.PROFESSIONAL]: {
    maxUsers: Infinity, // Usuarios ilimitados
    maxAlerts: 20, // Muchas alertas simultáneas
    maxPipelines: Infinity, // Pipelines ilimitados
    hasIntegrations: true, // Acceso a todas las integraciones
    hasWorkflows: true, // Workflows personalizados disponibles
    hasHistoricalAccess: true, // Acceso completo al histórico
  },
};

/**
 * Límites para Planes de Usuario Común (PUBLIC_USER)
 * Dos opciones: FREE (básico) | PREMIUM (extendido)
 */
export const USER_PLAN_LIMITS: Record<UserPlan, UserPlanLimits> = {
  [UserPlan.FREE]: {
    tokensPerMonth: 100, // 100 tokens para búsquedas
    canCreateAlerts: false, // No puede crear alertas personalizadas
    hasHistoricalAccess: false, // Solo datos recientes
    maxSavedSearches: 3, // Hasta 3 búsquedas guardadas
    hasAdvancedFilters: false, // Filtros básicos
  },
  [UserPlan.PREMIUM]: {
    tokensPerMonth: 1000, // 1000 tokens para búsquedas y IA
    canCreateAlerts: true, // Puede crear alertas personalizadas
    hasHistoricalAccess: true, // Acceso al histórico completo
    maxSavedSearches: Infinity, // Búsquedas ilimitadas
    hasAdvancedFilters: true, // Filtros avanzados disponibles
  },
};
