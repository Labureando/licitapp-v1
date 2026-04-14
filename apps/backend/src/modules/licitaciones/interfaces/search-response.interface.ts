export interface ISearchResponse<T> {
  /** Array de resultados */
  data: T[];

  /** Total de registros encontrados (sin paginación) */
  total: number;

  /** Página actual */
  page: number;

  /** Registros por página */
  pageSize: number;

  /** Total de páginas */
  totalPages: number;

  /** Indica si hay más resultados */
  hasMore: boolean;
}
