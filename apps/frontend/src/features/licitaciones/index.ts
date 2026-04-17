// Barrel del feature Licitaciones

// ─── API ─────────────────────────────────────────────────────
export { licitacionesApi } from './api/licitaciones.api';

// ─── Hooks ───────────────────────────────────────────────────
export * from './hooks/use-licitaciones';

// ─── Types ───────────────────────────────────────────────────
// Nota: `LicitacionCard` es el nombre del TYPE (shape del listado)
// y también del COMPONENTE. Para evitar colisión, los componentes
// no se re-exportan desde aquí — se importan por ruta directa:
//   import { LicitacionCard } from 'features/licitaciones/components/licitacion-card';
export type {
  LicitacionCard,
  LicitacionDetail,
  Licitacion,
  SearchParams,
  SearchResult,
  PaginatedResponse,
  LicitacionFilters,
  EstadoLicitacion,
  FilterOption,
  FilterOptions,
  Organo,
  LicitacionDocumento,
} from './types';

// ─── Utils ───────────────────────────────────────────────────
export * from './utils';

// ─── Pages ───────────────────────────────────────────────────
export { BuscarPage } from './pages/buscar-page';
export { LicitacionPage } from './pages/licitacion-page';