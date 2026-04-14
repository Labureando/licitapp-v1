import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { SearchLicitacionesDto } from './dto/search-licitaciones.dto';

@Injectable()
export class LicitacionesService {
  private readonly logger = new Logger(LicitacionesService.name);

  constructor(
    @InjectRepository(Licitacion)
    private readonly licRepo: Repository<Licitacion>,
    @InjectRepository(OrganoContratacion)
    private readonly orgRepo: Repository<OrganoContratacion>,
  ) {}

  async search(dto: SearchLicitacionesDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const qb = this.licRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.organo', 'o');

    // ── FULL-TEXT SEARCH ──
    if (dto.q && dto.q.trim()) {
      qb.andWhere(
        `l."searchVector" @@ plainto_tsquery('spanish', :q)`,
        { q: dto.q.trim() },
      );
    }
    // ── FILTROS ──
    if (dto.estado) {
      qb.andWhere('l.estado = :estado', { estado: dto.estado });
    }

    if (dto.tipoContrato) {
      qb.andWhere('l."tipoContrato" = :tipo', { tipo: dto.tipoContrato });
    }

    if (dto.procedimiento) {
      qb.andWhere('l.procedimiento = :proc', { proc: dto.procedimiento });
    }

    if (dto.ccaa) {
      qb.andWhere('l.ccaa ILIKE :ccaa', { ccaa: `%${dto.ccaa}%` });
    }

    if (dto.provincia) {
      qb.andWhere('l.provincia ILIKE :prov', { prov: `%${dto.provincia}%` });
    }

    if (dto.cpv) {
      qb.andWhere(':cpv = ANY(l."cpvCodes")', { cpv: dto.cpv });
    }

    if (dto.importeMin !== undefined) {
      qb.andWhere('CAST(l."presupuestoBase" AS BIGINT) >= :min', { min: dto.importeMin });
    }

    if (dto.importeMax !== undefined) {
      qb.andWhere('CAST(l."presupuestoBase" AS BIGINT) <= :max', { max: dto.importeMax });
    }

    if (dto.fechaDesde) {
      qb.andWhere('l."fechaPublicacion" >= :desde', { desde: new Date(dto.fechaDesde) });
    }

    if (dto.fechaHasta) {
      qb.andWhere('l."fechaPublicacion" <= :hasta', { hasta: new Date(dto.fechaHasta) });
    }

    if (dto.soloConPlazo) {
      qb.andWhere('l."fechaPresentacion" > NOW()');
    }

    if (dto.organoId) {
      qb.andWhere('l."organoId" = :orgId', { orgId: dto.organoId });
    }

     // ── ORDENACIÓN ──
    switch (dto.sortBy) {
      case 'importe':
        qb.orderBy('l.presupuestoBase', dto.sortOrder ?? 'DESC');
        break;
      case 'deadline':
        qb.orderBy('l.fechaPresentacion', 'ASC');
        break;
      case 'fecha':
      default:
        qb.orderBy('l.fechaPublicacion', dto.sortOrder ?? 'DESC');
        break;
    }

    // ── PAGINACIÓN ──
    const [data, total] = await qb.skip(skip).take(pageSize).getManyAndCount();

    return {
      data: data.map((l) => this.formatLicitacion(l)),
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

    return this.formatLicitacionDetalle(lic);
  }

  async getFilterOptions() {
    // Devolver valores únicos para los dropdowns de filtros
    const estados = await this.licRepo
      .createQueryBuilder('l')
      .select('l.estado', 'estado')
      .addSelect('COUNT(*)', 'count')
      .groupBy('l.estado')
      .orderBy('count', 'DESC')
      .getRawMany();

    const tipos = await this.licRepo
      .createQueryBuilder('l')
      .select('l."tipoContrato"', 'tipo')
      .addSelect('COUNT(*)', 'count')
      .where('l."tipoContrato" IS NOT NULL')
      .groupBy('l."tipoContrato"')
      .orderBy('count', 'DESC')
      .getRawMany();

    const ccaas = await this.licRepo
      .createQueryBuilder('l')
      .select('l.ccaa', 'ccaa')
      .addSelect('COUNT(*)', 'count')
      .where('l.ccaa IS NOT NULL')
      .groupBy('l.ccaa')
      .orderBy('count', 'DESC')
      .getRawMany();

    const procedimientos = await this.licRepo
      .createQueryBuilder('l')
      .select('l.procedimiento', 'procedimiento')
      .addSelect('COUNT(*)', 'count')
      .where('l.procedimiento IS NOT NULL')
      .groupBy('l.procedimiento')
      .orderBy('count', 'DESC')
      .getRawMany();

    return { estados, tipos, ccaas, procedimientos };
  }

  // ── FORMATTERS ──

  private formatLicitacion(l: Licitacion) {
    return {
      id: l.id,
      title: l.title,
      estado: l.estado,
      tipoContrato: l.tipoContrato,
      procedimiento: l.procedimiento,
      presupuestoBase: l.presupuestoBase ? Number(l.presupuestoBase) : null,
      presupuestoConIva: l.presupuestoConIva ? Number(l.presupuestoConIva) : null,
      cpvCodes: l.cpvCodes,
      ccaa: l.ccaa,
      provincia: l.provincia,
      fechaPublicacion: l.fechaPublicacion,
      fechaPresentacion: l.fechaPresentacion,
      organo: l.organo ? { id: l.organo.id, nombre: l.organo.nombre } : null,
      tieneLotes: l.tieneLotes,
    };
  }

  private formatLicitacionDetalle(l: Licitacion) {
    return {
      id: l.id,
      externalId: l.externalId,
      source: l.source,
      title: l.title,
      description: l.description,
      estado: l.estado,
      tipoContrato: l.tipoContrato,
      procedimiento: l.procedimiento,
      tramitacion: l.tramitacion,
      presupuestoBase: l.presupuestoBase ? Number(l.presupuestoBase) : null,
      presupuestoConIva: l.presupuestoConIva ? Number(l.presupuestoConIva) : null,
      cpvCodes: l.cpvCodes,
      ccaa: l.ccaa,
      provincia: l.provincia,
      municipio: l.municipio,
      fechaPublicacion: l.fechaPublicacion,
      fechaPresentacion: l.fechaPresentacion,
      fechaAdjudicacion: l.fechaAdjudicacion,
      fechaFormalizacion: l.fechaFormalizacion,
      adjudicatarioNombre: l.adjudicatarioNombre,
      adjudicatarioNif: l.adjudicatarioNif,
      importeAdjudicacion: l.importeAdjudicacion ? Number(l.importeAdjudicacion) : null,
      porcentajeBaja: l.porcentajeBaja,
      numLicitadores: l.numLicitadores,
      tieneLotes: l.tieneLotes,
      documentos: l.documentos,
      resumenIA: l.resumenIA,
      organo: l.organo
        ? {
            id: l.organo.id,
            externalId: l.organo.externalId,
            nombre: l.organo.nombre,
            tipo: l.organo.tipo,
            ccaa: l.organo.ccaa,
            web: l.organo.web,
          }
        : null,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };
  }
}