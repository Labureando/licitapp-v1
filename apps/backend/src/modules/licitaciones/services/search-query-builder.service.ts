import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';
import { ISearchQueryBuilder } from '../interfaces/search-query-builder.interface';

/**
 * Servicio que implementa el patrón Builder para construir queries dinámicamente.
 * Todos los filtros de dominio (estado, tipo, ccaa...) aceptan ARRAYS — multi-select.
 *
 * NOTA: usar array vacío / undefined / null es equivalente: el filtro se omite.
 */
@Injectable()
export class SearchQueryBuilderService implements ISearchQueryBuilder {
  private qb!: SelectQueryBuilder<Licitacion>;

  constructor(
    @InjectRepository(Licitacion)
    private readonly licRepo: Repository<Licitacion>,
  ) {
    this.resetQueryBuilder();
  }

  private resetQueryBuilder(): void {
    this.qb = this.licRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.organo', 'o');
  }

  // ═══════════════════════════════════════════════
  // Búsqueda full-text
  // ═══════════════════════════════════════════════

  addFullTextSearch(q?: string): this {
    if (q?.trim()) {
      this.qb.andWhere(
        `l."searchVector" @@ plainto_tsquery('spanish', :q)`,
        { q: q.trim() },
      );
    }
    return this;
  }

  // ═══════════════════════════════════════════════
  // Filtros multi-select (arrays → IN)
  // ═══════════════════════════════════════════════

  addStateFilter(estados?: string[]): this {
    if (estados?.length) {
      this.qb.andWhere('l.estado IN (:...estados)', { estados });
    }
    return this;
  }

  addTypeFilter(tipos?: string[]): this {
    if (tipos?.length) {
      this.qb.andWhere('l."tipoContrato" IN (:...tipos)', { tipos });
    }
    return this;
  }

  addProcedureFilter(procedimientos?: string[]): this {
    if (procedimientos?.length) {
      this.qb.andWhere('l.procedimiento IN (:...procs)', {
        procs: procedimientos,
      });
    }
    return this;
  }

  addUrgencyFilter(tramitaciones?: string[]): this {
    if (tramitaciones?.length) {
      this.qb.andWhere('l.tramitacion IN (:...trams)', {
        trams: tramitaciones,
      });
    }
    return this;
  }

  addLocationFilters(ccaa?: string[], provincia?: string[]): this {
    if (ccaa?.length) {
      this.qb.andWhere('l.ccaa IN (:...ccaas)', { ccaas: ccaa });
    }
    if (provincia?.length) {
      this.qb.andWhere('l.provincia IN (:...provs)', { provs: provincia });
    }
    return this;
  }

  // ═══════════════════════════════════════════════
  // Filtros single-value (strings / rangos)
  // ═══════════════════════════════════════════════

  addCpvFilter(cpv?: string): this {
    if (cpv) {
      this.qb.andWhere(':cpv = ANY(l."cpvCodes")', { cpv });
    }
    return this;
  }

  addPriceRange(min?: number, max?: number): this {
    if (min !== undefined && min !== null) {
      this.qb.andWhere('CAST(l."presupuestoBase" AS BIGINT) >= :min', { min });
    }
    if (max !== undefined && max !== null) {
      this.qb.andWhere('CAST(l."presupuestoBase" AS BIGINT) <= :max', { max });
    }
    return this;
  }

  addPublicationDateRange(desde?: Date, hasta?: Date): this {
    if (desde) {
      this.qb.andWhere('l."fechaPublicacion" >= :desde', { desde });
    }
    if (hasta) {
      this.qb.andWhere('l."fechaPublicacion" <= :hasta', { hasta });
    }
    return this;
  }

  addOpenDeadlineFilter(soloConPlazo?: boolean): this {
    if (soloConPlazo) {
      this.qb.andWhere('l."fechaPresentacion" > NOW()');
    }
    return this;
  }

  addOrganoFilter(organoId?: string): this {
    if (organoId) {
      this.qb.andWhere('l."organoId" = :orgId', { orgId: organoId });
    }
    return this;
  }

  // ═══════════════════════════════════════════════
  // Ordenación
  // ═══════════════════════════════════════════════

  applyOrderBy(
    sortBy?: 'fecha' | 'importe' | 'deadline',
    sortOrder?: 'ASC' | 'DESC',
  ): this {
    const order = sortOrder ?? 'DESC';

    switch (sortBy) {
      case 'importe':
        this.qb.orderBy('l.presupuestoBase', order, 'NULLS LAST');
        break;
      case 'deadline':
        this.qb.orderBy('l.fechaPresentacion', 'ASC', 'NULLS LAST');
        break;
      case 'fecha':
      default:
        this.qb.orderBy('l.fechaPublicacion', order, 'NULLS LAST');
        break;
    }

    return this;
  }

  // ═══════════════════════════════════════════════
  // Build
  // ═══════════════════════════════════════════════

  build(): SelectQueryBuilder<Licitacion> {
    const query = this.qb;
    this.resetQueryBuilder();
    return query;
  }
}