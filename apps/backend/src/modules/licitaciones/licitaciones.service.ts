/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { SearchLicitacionesDto } from './dto/search-licitaciones.dto';
import { SearchQueryBuilderService } from './services/search-query-builder.service';
import { LicitacionFormatterService } from './services/licitacion-formatter.service';
import { ISearchResponse } from './interfaces/search-response.interface';

/**
 * Servicio de Licitaciones - Orquestación de búsqueda y detalle
 * Delega lógica de queries a SearchQueryBuilderService
 * Delega lógica de formateo a LicitacionFormatterService
 */
@Injectable()
export class LicitacionesService {
  private readonly logger = new Logger(LicitacionesService.name);

  constructor(
    @InjectRepository(Licitacion)
    private readonly licRepo: Repository<Licitacion>,
    @InjectRepository(OrganoContratacion)
    private readonly orgRepo: Repository<OrganoContratacion>,
    private readonly queryBuilder: SearchQueryBuilderService,
    private readonly formatter: LicitacionFormatterService,
  ) {}

  /**
   * Buscar licitaciones con filtros avanzados
   * Utiliza el patrón Builder para construir queries dinámicamente
   */
  async search(dto: SearchLicitacionesDto): Promise<ISearchResponse<any>> {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Construir query usando el patrón Builder
    const qb = this.queryBuilder
      .addFullTextSearch(dto.q)
      .addStateFilter(dto.estado)
      .addTypeFilter(dto.tipoContrato)
      .addProcedureFilter(dto.procedimiento)
      .addLocationFilters(dto.ccaa, dto.provincia)
      .addCpvFilter(dto.cpv)
      .addPriceRange(dto.importeMin, dto.importeMax)
      .addPublicationDateRange(
        dto.fechaDesde ? new Date(dto.fechaDesde) : undefined,
        dto.fechaHasta ? new Date(dto.fechaHasta) : undefined,
      )
      .addOpenDeadlineFilter(dto.soloConPlazo)
      .addOrganoFilter(dto.organoId)
      .applyOrderBy(
        dto.sortBy as 'fecha' | 'importe' | 'deadline' | undefined,
        dto.sortOrder,
      )
      .build();

    // Aplicar paginación
    const [data, total] = await qb.skip(skip).take(pageSize).getManyAndCount();

    return {
      data: data.map((l) => this.formatter.formatList(l)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    };
  }

  /**
   * Obtener detalle completo de una licitación por ID
   */
  async findById(id: string) {
    const lic = await this.licRepo.findOne({
      where: { id },
      relations: ['organo'],
    });

    if (!lic) {
      throw new NotFoundException(`Licitación ${id} no encontrada`);
    }

    // Usar el formatterService en lugar de método privado
    return this.formatter.formatDetail(lic);
  }

  /**
   * Obtener opciones de filtros (estados, tipos, ccaa, procedimientos)
   * Ejecuta queries en paralelo para mejor performance
   */
  async getFilterOptions() {
    try {
      // Ejecutar todas las queries en paralelo
      const [estados, tipos, ccaas, procedimientos] = await Promise.all([
        this.queryFilterByField('estado'),
        this.queryFilterByField('tipoContrato'),
        this.queryFilterByField('ccaa'),
        this.queryFilterByField('procedimiento'),
      ]);

      return { estados, tipos, ccaas, procedimientos };
    } catch (error) {
      this.logger.error('Error fetching filter options', error);
      throw error;
    }
  }

  /**
   * Query genérica para obtener opciones de un campo
   * Reutilizable para diferentes campos
   * @private
   */
  private async queryFilterByField(field: string) {
    const fieldName = field === 'tipoContrato' ? `"${field}"` : field;
    const aliasName = field === 'tipoContrato' ? 'tipo' : field;

    return this.licRepo
      .createQueryBuilder('l')
      .select(`l.${fieldName}`, aliasName)
      .addSelect('COUNT(*)', 'count')
      .where(`l.${fieldName} IS NOT NULL`)
      .groupBy(`l.${fieldName}`)
      .orderBy('count', 'DESC')
      .getRawMany();
  }
}