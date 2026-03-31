import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { Alerta } from './alerta.entity';
import { SavedLicitacion } from './saved-licitacion.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: 'MEMBER' })
  role: string; // OWNER, ADMIN, EDITOR, VIEWER, MEMBER

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.users, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // OAuth
  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true, unique: true })
  microsoftId: string;

  // Auth tokens
  @Column({ nullable: true })
  refreshTokenHash: string;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true })
  resetTokenExpiry: Date;

  // Relaciones
  @OneToMany(() => Alerta, (alerta) => alerta.user)
  alertas: Alerta[];

  @OneToMany(() => SavedLicitacion, (saved) => saved.user)
  savedLicitaciones: SavedLicitacion[];

  // Preferencias
  @Column({ default: 'DAILY' })
  emailFrequency: string;

  @Column({ default: true })
  pushEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}