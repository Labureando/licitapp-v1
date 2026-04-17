import { SelectQueryBuilder } from 'typeorm';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';

/**
 * Interfaz del patrón Builder para construcción dinámica de queries.
 * Los filtros multi-select aceptan arrays; los single-value, strings/números.
 */
export interface ISearchQueryBuilder {
  addFullTextSearch(q?: string): this;

  // Multi-select (arrays)
  addStateFilter(estados?: string[]): this;
  addTypeFilter(tipos?: string[]): this;
  addProcedureFilter(procedimientos?: string[]): this;
  addUrgencyFilter(tramitaciones?: string[]): this;
  addLocationFilters(ccaa?: string[], provincia?: string[]): this;

  // Single-value / rangos
  addCpvFilter(cpv?: string): this;
  addPriceRange(min?: number, max?: number): this;
  addPublicationDateRange(desde?: Date, hasta?: Date): this;
  addOpenDeadlineFilter(soloConPlazo?: boolean): this;
  addOrganoFilter(organoId?: string): this;

  // Ordenación + build
  applyOrderBy(
    sortBy?: 'fecha' | 'importe' | 'deadline',
    sortOrder?: 'ASC' | 'DESC',
  ): this;
  build(): SelectQueryBuilder<Licitacion>;
}