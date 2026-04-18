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

/**
 * Entidad Tag (Etiqueta)
 * Representa etiquetas de búsqueda con soporte híbrido:
 * - GLOBALES: visibles para todos (isGlobal=true, userId=null)
 * - PRIVADAS: solo del usuario (isGlobal=false, userId=uuid)
 */
@Entity('tags')
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Nombre de la etiqueta
   * @example "Construcción"
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * Slug normalizado para URL y búsqueda
   * @example "construccion"
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  /**
   * Descripción de la etiqueta
   * @example "Proyectos de construcción e infraestructura"
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Categoría de la etiqueta
   * @example "infraestructura"
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

  /**
   * Palabras clave asociadas (para búsqueda)
   * @example ["construcción", "edificios", "obra", "arquitectura"]
   */
  @Column({ type: 'text', array: true, default: [] })
  keywords: string[];

  /**
   * Color en formato hex
   * @example "#FF5733"
   */
  @Column({ type: 'varchar', length: 7, nullable: true })
  color?: string;

  /**
   * Icono de la etiqueta
   * @example "building"
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string;

  /**
   * ¿Es etiqueta global? (visible para todos)
   * - true = global, visible en marketplace
   * - false = privada, solo del usuario
   */
  @Column({ type: 'boolean', default: true })
  isGlobal: boolean;

  /**
   * ID del usuario propietario (si es privada)
   * - null = global (sin propietario)
   * - uuid = privada (solo este usuario)
   */
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  /**
   * Relación con usuario (si es privada)
   */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  /**
   * Contador de uso (cuánta gente la usa)
   * Útil para ranking y estadísticas
   */
  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  /**
   * Votos para promover a global
   * Si alcanza X votos, admin puede moverla a global
   */
  @Column({ type: 'integer', default: 0 })
  votes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
