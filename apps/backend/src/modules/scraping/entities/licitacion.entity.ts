import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { OrganoContratacion } from './organo-contratacion.entity';

@Entity('licitaciones')
@Index(['externalId', 'source'], { unique: true })
@Index(['estado'])
@Index(['fechaPresentacion'])
export class Licitacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  externalId: string;

  @Column({ type: 'varchar', default: 'PLACE' })
  source: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('text', { array: true, default: '{}' })
  cpvCodes: string[];

  @Column({ type: 'bigint', nullable: true })
  presupuestoBase: string | null;

  @Column({ type: 'bigint', nullable: true })
  presupuestoConIva: string | null;

  @Column({ type: 'varchar', nullable: true })
  tipoContrato: string | null;

  @Column({ type: 'varchar', nullable: true })
  procedimiento: string | null;

  @Column({ type: 'varchar', default: 'DESCONOCIDO' })
  estado: string;

  @Column({ type: 'varchar', nullable: true })
  tramitacion: string | null;

  @Column({ type: 'varchar', nullable: true })
  ccaa: string | null;

  @Column({ type: 'varchar', nullable: true })
  provincia: string | null;

  @Column({ type: 'varchar', nullable: true })
  municipio: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  fechaPublicacion: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  fechaPresentacion: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  fechaAdjudicacion: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  fechaFormalizacion: Date | null;

  @Column({ type: 'varchar', nullable: true })
  adjudicatarioNombre: string | null;

  @Column({ type: 'varchar', nullable: true })
  adjudicatarioNif: string | null;

  @Column({ type: 'bigint', nullable: true })
  importeAdjudicacion: string | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  porcentajeBaja: number | null;

  @Column({ type: 'int', nullable: true })
  numLicitadores: number | null;

  @Column({ type: 'jsonb', default: '[]' })
  documentos: any[];

  @Column({ type: 'boolean', default: false })
  tieneLotes: boolean;

  @Column({ type: 'text', nullable: true })
  resumenIA: string | null;

  @Column({ type: 'boolean', default: false })
  pliegosProcesados: boolean;

  @Column({ type: 'uuid', nullable: true })
  organoId: string | null;

  @ManyToOne(() => OrganoContratacion, { nullable: true, eager: false })
  @JoinColumn({ name: 'organoId' })
  organo: OrganoContratacion | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}