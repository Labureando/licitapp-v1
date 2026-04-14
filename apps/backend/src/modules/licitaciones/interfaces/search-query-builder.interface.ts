import { SelectQueryBuilder } from 'typeorm';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';

export interface ISearchQueryBuilder {
  /**
   * Agrega búsqueda full-text en español
   * @param q Texto de búsqueda
   */
  addFullTextSearch(q?: string): this;

  /**
   * Agrega filtro por estado de licitación
   * @param estado Estado (ABIERTA, ADJUDICADA, etc.)
   */
  addStateFilter(estado?: string): this;

  /**
   * Agrega filtro por tipo de contrato
   * @param tipo Tipo (SERVICIOS, SUMINISTROS, etc.)
   */
  addTypeFilter(tipo?: string): this;

  /**
   * Agrega filtro por procedimiento
   * @param procedimiento Procedimiento (ABIERTO, RESTRINGIDO, etc.)
   */
  addProcedureFilter(procedimiento?: string): this;

  /**
   * Agrega filtros de ubicación
   * @param ccaa Comunidad Autónoma
   * @param provincia Provincia
   */
  addLocationFilters(ccaa?: string, provincia?: string): this;

  /**
   * Agrega filtro por datos CPV (clasificación de contratos)
   * @param cpv Código CPV
   */
  addCpvFilter(cpv?: string): this;

  /**
   * Agrega rango de precios
   * @param min Presupuesto mínimo (céntimos)
   * @param max Presupuesto máximo (céntimos)
   */
  addPriceRange(min?: number, max?: number): this;

  /**
   * Agrega rango de fechas de publicación
   * @param desde Fecha desde
   * @param hasta Fecha hasta
   */
  addPublicationDateRange(desde?: Date, hasta?: Date): this;

  /**
   * Agrega filtro para solo licitaciones con plazo abierto
   */
  addOpenDeadlineFilter(soloConPlazo?: boolean): this;

  /**
   * Agrega filtro por órgano de contratación
   * @param organoId ID del órgano
   */
  addOrganoFilter(organoId?: string): this;

  /**
   * Pone orden por un campo específico
   * @param sortBy Campo por el cual ordenar
   * @param sortOrder ASC o DESC
   */
  applyOrderBy(
    sortBy?: 'fecha' | 'importe' | 'deadline',
    sortOrder?: 'ASC' | 'DESC',
  ): this;

  /**
   * Construye y retorna el QueryBuilder
   */
  build(): SelectQueryBuilder<Licitacion>;
}
