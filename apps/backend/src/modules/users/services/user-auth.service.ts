import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';
import * as bcrypt from 'bcrypt';
import { UserQueryHelper } from '../helpers';

@Injectable()
export class UserAuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly queryHelper: UserQueryHelper,
  ) {}

  /**
   * Buscar usuario por email con contraseña (para autenticación)
   */
  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    const sanitizedEmail = email.toLowerCase().trim();
    return this.queryHelper
      .buildUserQuery(this.usersRepository)
      .where('user.email = :email', { email: sanitizedEmail })
      .addSelect('user.password')
      .getOne();
  }

  /**
   * Buscar usuario por Google ID
   */
  async findByGoogleId(google_id: string): Promise<UserEntity | null> {
    return this.queryHelper
      .buildUserQuery(this.usersRepository)
      .where('user.google_id = :google_id', { google_id })
      .addSelect('user.password')
      .getOne();
  }

  /**
   * Buscar usuario por email (sin contraseña)
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const sanitizedEmail = email.toLowerCase().trim();
    return this.queryHelper
      .buildUserQuery(this.usersRepository)
      .where('user.email = :email', { email: sanitizedEmail })
      .getOne();
  }

  /**
   * Validar contraseña
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hashear contraseña
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
}
