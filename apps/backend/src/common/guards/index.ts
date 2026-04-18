/**
 * Guards - Autorización y Control de Acceso
 * Arquitectura limpia en subcarpetas por categoría
 */

// Authentication
export * from './auth';

// Authorization (Roles, Permissions, Ownership)
export * from './authorization';

// Resource Management (Existence checks, Soft Delete)
export * from './resource';

// Data Integrity (Audit logging, Concurrency control)
export * from './data-integrity';

// Rate Limiting & Brute Force Protection
export * from './rate-limiting';

// Business Logic Guards (Plans, Subscriptions, etc.)
export * from './business';
