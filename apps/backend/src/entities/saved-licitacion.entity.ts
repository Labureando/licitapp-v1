import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { User } from './user.entity';
import { Licitacion } from './licitacion.entity';

@Entity('saved_licitaciones')
@Unique(['userId', 'licitacionId'])
export class SavedLicitacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.savedLicitaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  licitacionId: string;

  @ManyToOne(() => Licitacion, (lic) => lic.savedBy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'licitacionId' })
  licitacion: Licitacion;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}