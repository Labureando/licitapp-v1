import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from './tag.entity';

/**
 * Entidad UserTagSubscription
 * Relación muchos-a-muchos: Usuario se suscribe a Etiquetas
 * 
 * Permite:
 * - Usuarios seleccionar etiquetas globales favoritas
 * - Usuarios crear etiquetas privadas personalizadas
 * - Fijar etiquetas en dashboard
 */
@Entity('user_tag_subscriptions')
@Unique(['userId', 'tagId'])
export class UserTagSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID del usuario
   */
  @Column({ type: 'uuid' })
  userId: string;

  /**
   * ID de la etiqueta
   */
  @Column({ type: 'uuid' })
  tagId: string;

  /**
   * ¿Está fijada en el dashboard del usuario?
   */
  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  /**
   * Relación con usuario
   */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /**
   * Relación con etiqueta
   */
  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: TagEntity;

  @CreateDateColumn()
  subscribedAt: Date;
}
