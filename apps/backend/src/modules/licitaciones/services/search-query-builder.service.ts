import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';
import { ISearchQueryBuilder } from '../interfaces/search-query-builder.interface';

/**
 * Servicio que implementa el patrón Builder para construir queries dinámicamente
 * Permite encadenar filtros de forma limpia y legible
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

  addFullTextSearch(q?: string): this {
    if (q?.trim()) {
      this.qb.andWhere(
        `l."searchVector" @@ plainto_tsquery('spanish', :q)`,
        { q: q.trim() },
      );
    }
    return this;
  }

  addStateFilter(estado?: string): this {
    if (estado) {
      this.qb.andWhere('l.estado = :estado', { estado });
    }
    return this;
  }

  addTypeFilter(tipo?: string): this {
    if (tipo) {
      this.qb.andWhere('l."tipoContrato" = :tipo', { tipo });
    }
    return this;
  }

  addProcedureFilter(procedimiento?: string): this {
    if (procedimiento) {
      this.qb.andWhere('l.procedimiento = :proc', { proc: procedimiento });
    }
    return this;
  }

  addLocationFilters(ccaa?: string, provincia?: string): this {
    if (ccaa) {
      this.qb.andWhere('l.ccaa ILIKE :ccaa', { ccaa: `%${ccaa}%` });
    }
    if (provincia) {
      this.qb.andWhere('l.provincia ILIKE :prov', { prov: `%${provincia}%` });
    }
    return this;
  }

  addCpvFilter(cpv?: string): this {
    if (cpv) {
      this.qb.andWhere(':cpv = ANY(l."cpvCodes")', { cpv });
    }
    return this;
  }

  addPriceRange(min?: number, max?: number): this {
    if (min !== undefined) {
      this.qb.andWhere('CAST(l."presupuestoBase" AS BIGINT) >= :min', { min });
    }
    if (max !== undefined) {
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

  applyOrderBy(
    sortBy?: 'fecha' | 'importe' | 'deadline',
    sortOrder?: 'ASC' | 'DESC',
  ): this {
    const order = sortOrder ?? 'DESC';

    switch (sortBy) {
      case 'importe':
        this.qb.orderBy('l.presupuestoBase', order);
        break;
      case 'deadline':
        this.qb.orderBy('l.fechaPresentacion', 'ASC');
        break;
      case 'fecha':
      default:
        this.qb.orderBy('l.fechaPublicacion', order);
        break;
    }

    return this;
  }

  build(): SelectQueryBuilder<Licitacion> {
    const query = this.qb;
    // Reset para la próxima búsqueda (evita reutilización del queryBuilder)
    this.resetQueryBuilder();
    return query;
  }
}
