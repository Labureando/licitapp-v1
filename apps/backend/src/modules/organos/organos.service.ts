import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { SearchOrganosDto } from './dto/search-organos.dto';

export interface OrganoSearchResult {
  id: string;
  nombre: string;
  tipo: string | null;
  ccaa: string | null;
  provincia: string | null;
  totalLicitaciones: number;
}

@Injectable()
export class OrganosService {
  constructor(
    @InjectRepository(OrganoContratacion)
    private readonly orgRepo: Repository<OrganoContratacion>,
  ) {}

  /**
   * Autocompletado de órganos con count de licitaciones.
   *
   * ESTRATEGIA DE RENDIMIENTO:
   *   - Busca primero los 30 candidatos por filtros + nombre (query 1, ~20ms).
   *   - Luego hace UNA query con JOIN + GROUP BY para contar licitaciones
   *     solo de esos 30 IDs (query 2, ~10ms gracias al índice organoId).
   *
   * Total: ~30ms, sin subqueries correlacionadas ni bloqueos del scraper.
   */
  async search(dto: SearchOrganosDto): Promise<OrganoSearchResult[]> {
    const limit = dto.limit ?? 30;
    const q = dto.q?.trim().toLowerCase();

    // ─── Query 1: encontrar los 30 candidatos ─────────────────────
    const qb = this.orgRepo
      .createQueryBuilder('o')
      .select('o.id', 'id')
      .addSelect('o.nombre', 'nombre')
      .addSelect('o.tipo', 'tipo')
      .addSelect('o.ccaa', 'ccaa')
      .addSelect('o.provincia', 'provincia')
      .where("o.nombre != 'Desconocido'");

    if (dto.ccaa?.length) {
      qb.andWhere('o.ccaa IN (:...ccaas)', { ccaas: dto.ccaa });
    }
    if (dto.provincia?.length) {
      qb.andWhere('o.provincia IN (:...provs)', { provs: dto.provincia });
    }

    if (q) {
      qb.andWhere('LOWER(o.nombre) LIKE :qContains', {
        qContains: `%${q}%`,
      });
      qb.addSelect(
        `CASE WHEN LOWER(o.nombre) LIKE :qStart THEN 0 ELSE 1 END`,
        'matchRank',
      ).setParameter('qStart', `${q}%`);
      qb.orderBy('"matchRank"', 'ASC').addOrderBy('o.nombre', 'ASC');
    } else {
      qb.orderBy('o.nombre', 'ASC');
    }

    qb.limit(limit);

    const candidates = await qb.getRawMany<{
      id: string;
      nombre: string;
      tipo: string | null;
      ccaa: string | null;
      provincia: string | null;
    }>();

    if (candidates.length === 0) return [];

    // ─── Query 2: contar licitaciones solo de esos IDs ────────────
    const ids = candidates.map((c) => c.id);
    const counts = await this.orgRepo.manager
      .createQueryBuilder()
      .select('l."organoId"', 'organoId')
      .addSelect('COUNT(*)', 'count')
      .from('licitaciones', 'l')
      .where('l."organoId" IN (:...ids)', { ids })
      .groupBy('l."organoId"')
      .getRawMany<{ organoId: string; count: string }>();

    const countMap = new Map(counts.map((c) => [c.organoId, parseInt(c.count, 10)]));

    return candidates.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      ccaa: c.ccaa,
      provincia: c.provincia,
      totalLicitaciones: countMap.get(c.id) ?? 0,
    }));
  }

  async findById(id: string): Promise<OrganoContratacion> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException(`Órgano ${id} no encontrado`);
    return org;
  }

  async findByIds(ids: string[]): Promise<OrganoSearchResult[]> {
    if (ids.length === 0) return [];

    const rows = await this.orgRepo
      .createQueryBuilder('o')
      .select('o.id', 'id')
      .addSelect('o.nombre', 'nombre')
      .addSelect('o.tipo', 'tipo')
      .addSelect('o.ccaa', 'ccaa')
      .addSelect('o.provincia', 'provincia')
      .where('o.id IN (:...ids)', { ids })
      .getRawMany<{
        id: string;
        nombre: string;
        tipo: string | null;
        ccaa: string | null;
        provincia: string | null;
      }>();

    // Contar en una sola query
    const counts = await this.orgRepo.manager
      .createQueryBuilder()
      .select('l."organoId"', 'organoId')
      .addSelect('COUNT(*)', 'count')
      .from('licitaciones', 'l')
      .where('l."organoId" IN (:...ids)', { ids })
      .groupBy('l."organoId"')
      .getRawMany<{ organoId: string; count: string }>();

    const countMap = new Map(counts.map((c) => [c.organoId, parseInt(c.count, 10)]));

    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      ccaa: r.ccaa,
      provincia: r.provincia,
      totalLicitaciones: countMap.get(r.id) ?? 0,
    }));
  }
}