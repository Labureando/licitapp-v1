export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_OWNER = 'ORG_OWNER',
  ORG_ADMIN = 'ORG_ADMIN',
  ORG_MEMBER = 'ORG_MEMBER',
  ORG_VIEWER = 'ORG_VIEWER',
  PUBLIC_USER = 'PUBLIC_USER',
}

/**
 * Planes para Organizaciones
 * Enfocados en cantidad de usuarios y features colaborativas
 */
export enum OrganizationPlan {
  STARTER = 'STARTER', // 5 usuarios, features básicas
  PROFESSIONAL = 'PROFESSIONAL', // 20+ usuarios, todas las features
}

/**
 * Planes para Usuarios Comunes (PUBLIC_USER)
 * Enfocados en tokens/créditos y beneficios individuales
 */
export enum UserPlan {
  FREE = 'FREE', // 100 tokens/mes, búsqueda básica
  PREMIUM = 'PREMIUM', // 1000 tokens/mes, alertas, historial
}
