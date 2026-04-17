import { api } from '@/lib/api-client';
import type {
  LicitacionCard,
  LicitacionDetail,
  SearchParams,
  SearchResult,
  FilterOptions,
} from '../types';

/**
 * Wrapper de respuesta del backend. Todos los endpoints devuelven:
 *   { success: true, data: <payload> }
 */
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Convierte filtros a params URL.
 * Arrays → comma-separated: "estado=ABIERTA,ADJUDICADA"
 */
function toParams(filters: SearchParams): Record<string, string> {
  const params: Record<string, string> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      params[key] = value.join(',');
    } else if (typeof value === 'boolean') {
      params[key] = value ? 'true' : 'false';
    } else {
      params[key] = String(value);
    }
  });

  return params;
}

/** Helper: axios.data → envelope.data (desempaqueta el wrapper del backend) */
function unwrap<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data;
}

export const licitacionesApi = {
  /** GET /licitaciones — búsqueda paginada */
  search: (params: SearchParams = {}) =>
    api
      .get<ApiEnvelope<SearchResult<LicitacionCard>>>('/licitaciones', {
        params: toParams(params),
      })
      .then(unwrap),

  /** GET /licitaciones/:id — detalle */
  getById: (id: string) =>
    api
      .get<ApiEnvelope<LicitacionDetail>>(`/licitaciones/${id}`)
      .then(unwrap),

  /** GET /licitaciones/filters — opciones de dropdown */
  getFilters: () =>
    api.get<ApiEnvelope<FilterOptions>>('/licitaciones/filters').then(unwrap),
};