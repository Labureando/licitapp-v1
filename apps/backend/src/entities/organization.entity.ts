import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  nif: string;

  @Column({ nullable: true })
  cnae: string;

  @Column({ nullable: true })
  sector: string;

  @Column({ default: 'PYME' })
  size: string; // AUTONOMO, MICRO, PYME, MEDIANA, GRANDE

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  ccaa: string;

  @Column({ nullable: true })
  provincia: string;

  @Column('text', { array: true, default: '{}' })
  cpvPreferences: string[];

  @Column({ default: 'FREE' })
  plan: string; // FREE, PRO, BUSINESS, ENTERPRISE

  @Column({ nullable: true, unique: true })
  stripeCustomerId: string;

  @Column({ nullable: true, unique: true })
  stripeSubscriptionId: string;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}