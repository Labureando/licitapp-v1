import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Role, Plan, Timezone } from '../enums';
import { OrganizationEntity } from './organization.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  firstName!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  lastName!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone?: string;

  @Column({
    type: 'enum',
    enum: Timezone,
    default: Timezone.UTC,
  })
  timezone!: Timezone;

  @Column({
    type: 'varchar',
    select: false,
  })
  password!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.PUBLIC_USER,
  })
  role!: Role;

  /**
   * Plan personal del usuario (usado para PUBLIC_USER)
   * Usuarios de organización heredan limites del plan organizacional
   */
  @Column({
    type: 'enum',
    enum: Plan,
    default: Plan.FREE,
    nullable: true,
  })
  userPlan?: Plan;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (org) => org.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordResetToken?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  passwordResetExpiresAt?: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
