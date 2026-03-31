import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Alerta } from './alerta.entity';
import { Licitacion } from './licitacion.entity';

@Entity('alert_matches')
@Unique(['alertaId', 'licitacionId'])
export class AlertMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  alertaId: string;

  @ManyToOne(() => Alerta, (alerta) => alerta.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alertaId' })
  alerta: Alerta;

  @Column()
  licitacionId: string;

  @ManyToOne(() => Licitacion, (lic) => lic.alertMatches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'licitacionId' })
  licitacion: Licitacion;

  @Column({ type: 'float', nullable: true })
  relevanceScore: number;

  @Column({ default: false })
  notifiedEmail: boolean;

  @Column({ default: false })
  notifiedPush: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}