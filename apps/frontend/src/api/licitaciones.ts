import { api } from './client';

export interface SearchParams {
  q?: string;
  estado?: string;
  tipoContrato?: string;
  procedimiento?: string;
  ccaa?: string;
  cpv?: string;
  importeMin?: number;
  importeMax?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  soloConPlazo?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface LicitacionCard {
  id: string;
  title: string;
  estado: string;
  tipoContrato: string | null;
  procedimiento: string | null;
  presupuestoBase: number | null;
  presupuestoConIva: number | null;
  cpvCodes: string[];
  ccaa: string | null;
  provincia: string | null;
  fechaPublicacion: string | null;
  fechaPresentacion: string | null;
  organo: { id: string; nombre: string } | null;
  tieneLotes: boolean;
}

export interface SearchResult {
  data: LicitacionCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export const licitacionesApi = {
  search: (params: SearchParams) =>
    api.get<{ data: SearchResult }>('/licitaciones', { params }).then((r) => r.data.data),

  getById: (id: string) =>
    api.get<{ data: any }>(`/licitaciones/${id}`).then((r) => r.data.data),

  getFilters: () =>
    api.get<{ data: any }>('/licitaciones/filters').then((r) => r.data.data),
};