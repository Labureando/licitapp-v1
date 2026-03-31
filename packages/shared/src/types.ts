// ── Licitación ──
export interface Licitacion {
  id: string;
  externalId: string;
  source: string;
  title: string;
  description: string | null;
  cpvCodes: string[];
  organoId: string | null;
  organo: OrganoContratacion | null;
  presupuestoBase: number | null;
  presupuestoConIva: number | null;
  tipoContrato: string | null;
  procedimiento: string | null;
  estado: string;
  tramitacion: string | null;
  ccaa: string | null;
  provincia: string | null;
  municipio: string | null;
  fechaPublicacion: string | null;
  fechaPresentacion: string | null;
  fechaAdjudicacion: string | null;
  fechaFormalizacion: string | null;
  documentos: Documento[];
  adjudicatarioNombre: string | null;
  adjudicatarioNif: string | null;
  importeAdjudicacion: number | null;
  porcentajeBaja: number | null;
  numLicitadores: number | null;
  tieneLotes: boolean;
  resumenIA: string | null;
  pliegosProcesados: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Documento {
  nombre: string;
  url: string;
  tipo: string;
}

// ── Órgano ──
export interface OrganoContratacion {
  id: string;
  externalId: string;
  nombre: string;
  tipo: string | null;
  ccaa: string | null;
  provincia: string | null;
  web: string | null;
  activo: boolean;
}

// ── User ──
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  organizationId: string | null;
  organization: Organization | null;
}

// ── Organization ──
export interface Organization {
  id: string;
  name: string;
  nif: string | null;
  cnae: string | null;
  sector: string | null;
  size: string;
  ccaa: string | null;
  cpvPreferences: string[];
  plan: string;
}

// ── Alerta ──
export interface Alerta {
  id: string;
  userId: string;
  name: string;
  cpvCodes: string[];
  keywords: string[];
  excludeKeywords: string[];
  ccaa: string[];
  provincias: string[];
  importeMin: number | null;
  importeMax: number | null;
  tiposContrato: string[];
  isActive: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  matchCount?: number;
}

// ── API responses ──
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}