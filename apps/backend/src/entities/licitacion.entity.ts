import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, Unique } from 'typeorm';
import { OrganoContratacion } from './organo-contratacion.entity';
import { AlertMatch } from './alert-match.entity';
import { SavedLicitacion } from './saved-licitacion.entity';

@Entity('licitaciones')
@Unique(['externalId', 'source'])
export class Licitacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  externalId: string;

  @Column()
  @Index()
  source: string;

  // Datos de PLACE/BOE/TED
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('text', { array: true, default: '{}' })
  cpvCodes: string[];

  @Column({ nullable: true })
  organoId: string;

  @ManyToOne(() => OrganoContratacion, (organo) => organo.licitaciones, { nullable: true })
  @JoinColumn({ name: 'organoId' })
  organo: OrganoContratacion;

  @Column({ type: 'bigint', nullable: true })
  presupuestoBase: string; // bigint viene como string en TypeORM

  @Column({ type: 'bigint', nullable: true })
  presupuestoConIva: string;

  @Column({ nullable: true })
  tipoContrato: string;

  @Column({ nullable: true })
  procedimiento: string;

  @Column({ default: 'ABIERTA' })
  @Index()
  estado: string;

  @Column({ nullable: true })
  tramitacion: string;

  // Ubicación
  @Column({ nullable: true })
  @Index()
  ccaa: string;

  @Column({ nullable: true })
  provincia: string;

  @Column({ nullable: true })
  municipio: string;

  // Fechas
  @Column({ nullable: true })
  fechaPublicacion: Date;

  @Column({ nullable: true })
  @Index()
  fechaPresentacion: Date;

  @Column({ nullable: true })
  fechaAdjudicacion: Date;

  @Column({ nullable: true })
  fechaFormalizacion: Date;

  // Documentos (JSON con URLs de pliegos)
  @Column({ type: 'jsonb', default: '[]' })
  documentos: any;

  // Adjudicación
  @Column({ nullable: true })
  adjudicatarioNombre: string;

  @Column({ nullable: true })
  adjudicatarioNif: string;

  @Column({ type: 'bigint', nullable: true })
  importeAdjudicacion: string;

  @Column({ type: 'float', nullable: true })
  porcentajeBaja: number;

  @Column({ nullable: true })
  numLicitadores: number;

  // Lotes
  @Column({ default: false })
  tieneLotes: boolean;

  @Column({ type: 'jsonb', default: '[]' })
  lotes: any;

  // IA
  @Column({ type: 'text', nullable: true })
  resumenIA: string;

  @Column({ default: false })
  pliegosProcesados: boolean;

  // Relaciones
  @OneToMany(() => AlertMatch, (match) => match.licitacion)
  alertMatches: AlertMatch[];

  @OneToMany(() => SavedLicitacion, (saved) => saved.licitacion)
  savedBy: SavedLicitacion[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}