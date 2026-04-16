import { Plan } from '../../../enums';
import { PlanLimits } from './limits.interface';

/**
 * Límites Unificados para Todos los Planes
 * Basado en roles-y-planes.md
 * Diferencia entre planes de usuarios individuales (FREE, PRO, ADVANCED) y organizaciones (STARTER, PROFESSIONAL)
 */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  // ========== PLANES PARA USUARIOS INDIVIDUALES (PUBLIC_USER) ==========

  // === FREE ===
  // Gratis: 50 créditos IA, 1 alerta, búsqueda básica, 3 meses histórico
  [Plan.FREE]: {
    maxUsers: 1,
    maxAlerts: 1,
    maxPipelines: 0,
    hasIntegrations: false,
    hasWorkflows: false,
    hasHistoricalAccess: false,
    tokensPerMonth: 50,
    canCreateAlerts: true,
    maxSavedSearches: 3,
    hasAdvancedFilters: false,
  },

  // === PRO ===
  // $XX/mes: 500 créditos IA, 5 alertas, búsqueda avanzada, 6 meses histórico
  [Plan.PRO]: {
    maxUsers: 5,
    maxAlerts: 5,
    maxPipelines: 0,
    hasIntegrations: false,
    hasWorkflows: false,
    hasHistoricalAccess: true,
    tokensPerMonth: 500,
    canCreateAlerts: true,
    maxSavedSearches: Infinity,
    hasAdvancedFilters: true,
  },

  // === ADVANCED ===
  // $XX/mes: 1.000 créditos IA, 10 alertas, búsqueda premium, 1 año histórico
  [Plan.ADVANCED]: {
    maxUsers: 10,
    maxAlerts: 10,
    maxPipelines: 0,
    hasIntegrations: false,
    hasWorkflows: false,
    hasHistoricalAccess: true,
    tokensPerMonth: 1000,
    canCreateAlerts: true,
    maxSavedSearches: Infinity,
    hasAdvancedFilters: true,
  },

  // ========== PLANES PARA ORGANIZACIONES (PAGO OBLIGATORIO) ==========

  // === STARTER ===
  // $XX/mes: 3 usuarios, 5 alertas, 500 créditos IA/mes, 6 meses histórico
  [Plan.STARTER]: {
    maxUsers: 3,
    maxAlerts: 5,
    maxPipelines: 0,
    hasIntegrations: false,
    hasWorkflows: false,
    hasHistoricalAccess: true,
    tokensPerMonth: 500,
    canCreateAlerts: true,
    maxSavedSearches: Infinity,
    hasAdvancedFilters: true,
  },

  // === PROFESSIONAL ===
  // $XXX/mes: 10 usuarios, 15 alertas, 5.000 créditos IA/mes, 2 años histórico, webhooks/integraciones
  [Plan.PROFESSIONAL]: {
    maxUsers: 10,
    maxAlerts: 15,
    maxPipelines: 0,
    hasIntegrations: true,
    hasWorkflows: false,
    hasHistoricalAccess: true,
    tokensPerMonth: 5000,
    canCreateAlerts: true,
    maxSavedSearches: Infinity,
    hasAdvancedFilters: true,
  },
};

/**
 * @deprecated Usar PLAN_LIMITS
 */
export const ORGANIZATION_PLAN_LIMITS = PLAN_LIMITS;
export const USER_PLAN_LIMITS = PLAN_LIMITS;
