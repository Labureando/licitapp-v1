import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Licitacion } from './licitacion.entity';

@Entity('organos_contratacion')
export class OrganoContratacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  externalId: string;

  @Column()
  @Index()
  nombre: string;

  @Column({ nullable: true })
  tipo: string;

  @Column({ nullable: true })
  @Index()
  ccaa: string;

  @Column({ nullable: true })
  provincia: string;

  @Column({ nullable: true })
  web: string;

  @Column({ nullable: true })
  plataforma: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Licitacion, (lic) => lic.organo)
  licitaciones: Licitacion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}