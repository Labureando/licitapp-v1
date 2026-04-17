import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UserEntity } from '../entities';

@Injectable()
export class UserQueryHelper {
  private readonly USER_SAFE_FIELDS = [
    'user.id',
    'user.email',
    'user.firstName',
    'user.lastName',
    'user.role',
    'user.isActive',
    'user.createdAt',
    'user.updatedAt',
  ];

  private readonly USER_LIST_FIELDS = [
    'user.id',
    'user.email',
    'user.firstName',
    'user.lastName',
    'user.role',
    'user.isActive',
    'user.createdAt',
  ];

  /**
   * Construir QueryBuilder base para búsquedas de usuarios
   */
  buildUserQuery(repository: Repository<UserEntity>): SelectQueryBuilder<UserEntity> {
    return repository.createQueryBuilder('user');
  }

  /**
   * Aplicar select seguro a un query (sin password)
   */
  applyUserSelect(
    query: SelectQueryBuilder<UserEntity>,
    fields?: string[],
  ): SelectQueryBuilder<UserEntity> {
    const fieldsToUse = fields || this.USER_SAFE_FIELDS;
    return query.select(fieldsToUse);
  }

  /**
   * Obtener campos seguros
   */
  getSafeFields(): string[] {
    return this.USER_SAFE_FIELDS;
  }

  /**
   * Obtener campos para listado
   */
  getListFields(): string[] {
    return this.USER_LIST_FIELDS;
  }
}
