import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { AlertMatch } from './alert-match.entity';

@Entity('alertas')
export class Alerta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.alertas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column('text', { array: true, default: '{}' })
  cpvCodes: string[];

  @Column('text', { array: true, default: '{}' })
  keywords: string[];

  @Column('text', { array: true, default: '{}' })
  excludeKeywords: string[];

  @Column('text', { array: true, default: '{}' })
  ccaa: string[];

  @Column('text', { array: true, default: '{}' })
  provincias: string[];

  @Column({ type: 'bigint', nullable: true })
  importeMin: string;

  @Column({ type: 'bigint', nullable: true })
  importeMax: string;

  @Column('text', { array: true, default: '{}' })
  tiposContrato: string[];

  @Column('text', { array: true, default: '{}' })
  procedimientos: string[];

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: true })
  pushEnabled: boolean;

  @OneToMany(() => AlertMatch, (match) => match.alerta)
  matches: AlertMatch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}