export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_OWNER = 'ORG_OWNER',
  ORG_MEMBER = 'ORG_MEMBER',
  PUBLIC_USER = 'PUBLIC_USER',
}

/**
 * Planes del Sistema
 * 
 * USUARIOS INDIVIDUALES (PUBLIC_USER):
 * - FREE: Gratis, acceso limitado
 * - PRO: Pago mensual, acceso intermedio
 * - ADVANCED: Pago mensual, acceso completo
 * 
 * ORGANIZACIONES (ORG_OWNER + ORG_MEMBER):
 * - STARTER: Pago obligatorio, pequeños equipos
 * - PROFESSIONAL: Pago obligatorio, equipos medianos/grandes
 * 
 * Basado en roles-y-planes.md
 */
export enum Plan {
  // Planes para usuarios individuales (PUBLIC_USER)
  FREE = 'FREE', // Gratis: 50 créditos IA, 1 alerta, búsqueda básica
  PRO = 'PRO', // $XX/mes: 500 créditos IA, 5 alertas, búsqueda avanzada
  ADVANCED = 'ADVANCED', // $XX/mes: 1.000 créditos IA, 10 alertas, búsqueda premium

  // Planes para organizaciones (ORG_OWNER + ORG_MEMBER)
  STARTER = 'STARTER', // $XX/mes (obligatorio): 3 usuarios, 5 alertas, 500 créditos IA/mes
  PROFESSIONAL = 'PROFESSIONAL', // $XXX/mes (obligatorio): 10 usuarios, 15 alertas, 5.000 créditos IA/mes
}

/**
 * Alias para retrocompatibilidad (deprecated)
 * @deprecated Usar Plan directamente
 */
export const OrganizationPlan = Plan;
export const UserPlan = Plan;

export { Timezone } from './timezone.enum';
