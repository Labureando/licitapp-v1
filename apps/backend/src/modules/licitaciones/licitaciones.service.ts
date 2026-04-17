/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { SearchQueryBuilderService } from './services/search-query-builder.service';
import { LicitacionFormatterService } from './services/licitacion-formatter.service';
import { ISearchResponse } from './interfaces/search-response.interface';
import { SearchLicitacionesDto } from './dto/search-licitaciones.dto';

// ═══════════════════════════════════════════════════════════════════
// WHITELISTS de valores válidos para filtros
// Licitaciones con valores fuera de estos sets se IGNORAN en los
// dropdowns (pero siguen existiendo en BD — se limpian al re-scrapear)
// ═══════════════════════════════════════════════════════════════════

const VALID_ESTADOS = new Set([
  'ABIERTA',
  'CERRADA',
  'ADJUDICADA',
  'RESUELTA',
  'DESIERTA',
  'ANULADA',
  'ANUNCIO_PREVIO',
  // DESCONOCIDO lo excluimos del dropdown adrede — no aporta
]);

const VALID_TIPOS = new Set([
  'OBRAS',
  'SERVICIOS',
  'SUMINISTROS',
  'OTROS',
  'MIXTO',
  'PRIVADO',
  'PATRIMONIAL',
  'ADMINISTRATIVO_ESPECIAL',
  'CONCESION_OBRAS',
  'CONCESION_SERVICIOS',
  'ACUERDO_MARCO',
  'SISTEMA_DINAMICO',
]);

const VALID_PROCEDIMIENTOS = new Set([
  'ABIERTO',
  'RESTRINGIDO',
  'NEGOCIADO_SIN_PUBLICIDAD',
  'NEGOCIADO_CON_PUBLICIDAD',
  'DIALOGO_COMPETITIVO',
  'SIMPLIFICADO',
  'SIMPLIFICADO_ABREVIADO',
  'CONCURSO_PROYECTOS',
  'OTROS',
  'SISTEMA_DINAMICO',
  'ASOCIACION_INNOVACION',
  'NORMAS_INTERNAS',
  'BASADO_ACUERDO_MARCO',
  'NO_DEFINIDO',
]);

const VALID_TRAMITACIONES = new Set([
  'ORDINARIA',
  'URGENTE',
  'EMERGENCIA',
]);

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

  async search(dto: SearchLicitacionesDto): Promise<ISearchResponse<any>> {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const qb = this.queryBuilder
      .addFullTextSearch(dto.q)
      .addStateFilter(dto.estado)
      .addTypeFilter(dto.tipoContrato)
      .addProcedureFilter(dto.procedimiento)
      .addUrgencyFilter(dto.tramitacion)
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

  async findById(id: string) {
    const lic = await this.licRepo.findOne({
      where: { id },
      relations: ['organo'],
    });

    if (!lic) {
      throw new NotFoundException(`Licitación ${id} no encontrada`);
    }

    return this.formatter.formatDetail(lic);
  }

  /**
   * Opciones para los dropdowns de filtros.
   * Aplica WHITELIST — solo devuelve valores del enum válido.
   * Los códigos sucios (ej. "50", "22", "32") quedan filtrados.
   */
  async getFilterOptions() {
    try {
      const [
        estados,
        tipos,
        procedimientos,
        tramitaciones,
        ccaas,
        provincias,
      ] = await Promise.all([
        this.queryFilterByField('estado'),
        this.queryFilterByField('tipoContrato'),
        this.queryFilterByField('procedimiento'),
        this.queryFilterByField('tramitacion'),
        this.queryFilterByField('ccaa', 'ASC'),
        this.queryFilterByField('provincia', 'ASC'),
      ]);

      return {
        estados: this.applyWhitelist(estados, VALID_ESTADOS),
        tipos: this.applyWhitelist(tipos, VALID_TIPOS),
        procedimientos: this.applyWhitelist(procedimientos, VALID_PROCEDIMIENTOS),
        tramitaciones: this.applyWhitelist(tramitaciones, VALID_TRAMITACIONES),
        // CCAAs y provincias no necesitan whitelist — ya son valores geográficos
        ccaas,
        provincias,
      };
    } catch (error) {
      this.logger.error('Error fetching filter options', error);
      throw error;
    }
  }

  /**
   * Filtra los resultados a solo los valores permitidos por la whitelist.
   * Los valores sucios (códigos numéricos, enums inválidos) quedan fuera.
   */
  private applyWhitelist(
    rows: Array<{ value: string; count: number }>,
    whitelist: Set<string>,
  ): Array<{ value: string; count: number }> {
    return rows.filter((r) => whitelist.has(r.value));
  }

  private async queryFilterByField(
    field: string,
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<Array<{ value: string; count: number }>> {
    const camelCaseFields = ['tipoContrato'];
    const col = camelCaseFields.includes(field) ? `"${field}"` : field;

    const rows = await this.licRepo
      .createQueryBuilder('l')
      .select(`l.${col}`, 'value')
      .addSelect('COUNT(*)', 'count')
      .where(`l.${col} IS NOT NULL`)
      .andWhere(`l.${col} != ''`)
      .groupBy(`l.${col}`)
      .orderBy(order === 'ASC' ? 'value' : 'count', order)
      .getRawMany<{ value: string; count: string }>();

    return rows.map((r) => ({
      value: r.value,
      count: parseInt(r.count, 10),
    }));
  }
}