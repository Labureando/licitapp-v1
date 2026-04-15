import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Role, UserPlan } from '../enums';
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
    enum: UserPlan,
    default: UserPlan.FREE,
    nullable: true,
  })
  userPlan?: UserPlan;

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
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
