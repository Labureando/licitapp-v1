import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('alerts')
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  // Criterios de búsqueda
  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
  })
  estados?: string[] | null;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
  })
  tiposContrato?: string[] | null;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
  })
  procedimientos?: string[] | null;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
  })
  tramitaciones?: string[] | null;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
  })
  ccaas?: string[] | null;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
  })
  provincias?: string[] | null;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    nullable: true,
  })
  cpvCodes?: string[] | null;

  @Column({ type: 'bigint', nullable: true })
  importeMin?: string | null;

  @Column({ type: 'bigint', nullable: true })
  importeMax?: string | null;

  @Column({ type: 'varchar', nullable: true })
  palabrasClave?: string | null;

  // Control de activación y triggers
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastTriggeredAt?: Date | null;

  @Column({ type: 'integer', default: 0 })
  triggerCount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
