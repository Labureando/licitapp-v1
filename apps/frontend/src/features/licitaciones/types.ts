// ═══════════════════════════════════════════════
// Estados de licitación (enum-like)
// ═══════════════════════════════════════════════

export type EstadoLicitacion =
  | 'ABIERTA'
  | 'CERRADA'
  | 'ADJUDICADA'
  | 'RESUELTA'
  | 'DESIERTA'
  | 'ANULADA'
  | 'ANUNCIO_PREVIO'
  | 'DESCONOCIDO';

// ═══════════════════════════════════════════════
// Shape del LISTADO (lo que devuelve GET /licitaciones)
// El formatter.formatList() devuelve este shape — es la
// versión "lite" para la card del listado.
// ═══════════════════════════════════════════════

export interface LicitacionCard {
  id: string;
  externalId: string;
  title: string;
  estado: EstadoLicitacion | string;
  tipoContrato: string | null;
  procedimiento: string | null;
  tramitacion: string | null;
  presupuestoBase: number | null;
  fechaPublicacion: string | null;
  fechaPresentacion: string | null;
  ccaa: string | null;
  provincia: string | null;
  municipio: string | null;
  organo: {
    id: string;
    nombre: string;
  } | null;
}

// ═══════════════════════════════════════════════
// Shape de la FICHA completa (lo que devuelve GET /licitaciones/:id)
// ═══════════════════════════════════════════════

export interface LicitacionDetail {
  id: string;
  externalId: string;
  source: string;
  title: string;
  description: string | null;
  cpvCodes: string[];
  presupuestoBase: number | null;
  presupuestoConIva: number | null;
  tipoContrato: string | null;
  procedimiento: string | null;
  estado: EstadoLicitacion | string;
  tramitacion: string | null;
  ccaa: string | null;
  provincia: string | null;
  municipio: string | null;
  fechaPublicacion: string | null;
  fechaPresentacion: string | null;
  fechaAdjudicacion: string | null;
  adjudicatarioNombre: string | null;
  adjudicatarioNif: string | null;
  importeAdjudicacion: number | null;
  porcentajeBaja: number | null;
  numLicitadores: number | null;
  tieneLotes: boolean;
  documentos: LicitacionDocumento[];
  organo: Organo | null;
}

// Alias por compatibilidad con código existente
export type Licitacion = LicitacionDetail;

export interface LicitacionDocumento {
  nombre: string;
  url: string;
  tipo: string;
}

export interface Organo {
  id: string;
  nombre: string;
  tipo: string | null;
  ccaa: string | null;
  provincia: string | null;
}

// ═══════════════════════════════════════════════
// Params de búsqueda (SearchParams) — alineados con el DTO backend
// ═══════════════════════════════════════════════

export interface SearchParams {
  q?: string;

  // Multi-select (arrays)
  estado?: string[];
  tipoContrato?: string[];
  procedimiento?: string[];
  tramitacion?: string[];
  ccaa?: string[];
  provincia?: string[];

  // Single-value / rangos
  cpv?: string;
  importeMin?: number;
  importeMax?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  soloConPlazo?: boolean;
  organoId?: string;

  // Ordenación + paginación
  sortBy?: 'fecha' | 'importe' | 'deadline';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  pageSize?: number;
}

// Alias por compatibilidad
export type LicitacionFilters = SearchParams;

// ═══════════════════════════════════════════════
// Respuesta paginada del backend
// ═══════════════════════════════════════════════

export interface SearchResult<T = LicitacionCard> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// Alias por compatibilidad
export type PaginatedResponse<T> = SearchResult<T>;

// ═══════════════════════════════════════════════
// Opciones de filtro (shape uniforme del backend)
// ═══════════════════════════════════════════════

export interface FilterOption {
  value: string;
  count: number;
}

export interface FilterOptions {
  estados: FilterOption[];
  tipos: FilterOption[];
  procedimientos: FilterOption[];
  tramitaciones: FilterOption[];
  ccaas: FilterOption[];
  provincias: FilterOption[];
}