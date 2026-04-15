/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  BadRequestException,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { UserEntity, OrganizationEntity } from './entities';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Role } from './enums';
import { EmailService } from '../../infrastructure/email';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 10;

  // ============ CONSTANTES DE CAMPOS SELECCIONABLES ============
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

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationsRepository: Repository<OrganizationEntity>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  // ============ MÉTODOS PRIVADOS HELPER ============

  /**
   * Sanitizar email (convertir a minúsculas)
   */
  private sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Sanitizar nombres (trim)
   */
  private sanitizeName(name: string): string {
    return name.trim();
  }

  /**
   * Construir QueryBuilder base para búsquedas de usuarios
   */
  private buildUserQuery(): SelectQueryBuilder<UserEntity> {
    return this.usersRepository.createQueryBuilder('user');
  }

  /**
   * Aplicar select seguro a un query (sin password)
   */
  private applyUserSelect(
    query: SelectQueryBuilder<UserEntity>,
    fields: string[] = this.USER_SAFE_FIELDS,
  ): SelectQueryBuilder<UserEntity> {
    return query.select(fields);
  }

  // ============ MÉTODOS PÚBLICOS ============

  /**
   * Crear un nuevo usuario con transacción
   * @param createUserDto - Datos para crear usuario
   * @returns Usuario creado
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sanitizedEmail = this.sanitizeEmail(createUserDto.email);

      // Verificar si el correo ya existe
      const existingUser = await queryRunner.manager.findOne(UserEntity, {
        where: { email: sanitizedEmail },
      });

      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // Validar organización si se proporciona
      if (createUserDto.organizationId) {
        const organization = await queryRunner.manager.findOne(OrganizationEntity, {
          where: { id: createUserDto.organizationId },
        });

        if (!organization) {
          throw new BadRequestException('La organización no existe');
        }

        // Verificar límites de la organización si no es SUPER_ADMIN
        if (createUserDto.role !== Role.SUPER_ADMIN) {
          const userCount = await queryRunner.manager.count(UserEntity, {
            where: { organizationId: createUserDto.organizationId },
          });
          // TODO: Integrar LimitsService para validar límites según plan
        }
      }

      // Hashear contraseña
      const hashedPassword = await this.hashPassword(createUserDto.password);

      // Crear usuario
      const user = queryRunner.manager.create(UserEntity, {
        email: sanitizedEmail,
        firstName: this.sanitizeName(createUserDto.firstName),
        lastName: this.sanitizeName(createUserDto.lastName),
        password: hashedPassword,
        role: createUserDto.role || Role.PUBLIC_USER,
        userPlan: createUserDto.userPlan || undefined,
        organizationId: createUserDto.organizationId || undefined,
        isActive: true,
      });

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      this.logger.log(`Usuario creado: ${savedUser.email}`);

      // Enviar correo de bienvenida (fuera de la transacción)
      try {
        await this.emailService.sendWelcomeEmail(
          savedUser.email,
          savedUser.firstName,
        );
      } catch (error) {
        this.logger.warn(
          `Error al enviar correo de bienvenida a ${savedUser.email}: ${(error as Error).message}`,
        );
        // No lanzar error, el usuario ya fue creado
      }

      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al crear usuario: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Listar usuarios de una organización
   * @param organizationId - ID de la organización
   * @returns Lista de usuarios
   */
  async listByOrganization(organizationId: string): Promise<Partial<UserEntity>[]> {
    return this.applyUserSelect(
      this.buildUserQuery()
        .where('user.organizationId = :organizationId', { organizationId }),
      this.USER_LIST_FIELDS,
    )
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Buscar usuario por correo (solo para autenticación)
   * @param email - Correo del usuario
   * @returns Usuario con contraseña para autenticación
   */
  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    const sanitizedEmail = this.sanitizeEmail(email);
    return this.buildUserQuery()
      .where('user.email = :email', { email: sanitizedEmail })
      .addSelect('user.password')
      .getOne();
  }

  /**
   * Buscar usuario por ID (sin contraseña)
   * @param userId - ID del usuario
   * @param organizationId - Opcional: ID de la organización para contexto
   * @returns Datos del usuario
   */
  async findOne(
    userId: string,
    organizationId?: string,
  ): Promise<Partial<UserEntity>> {
    let query = this.buildUserQuery().where('user.id = :userId', { userId });

    if (organizationId) {
      query = query.andWhere('user.organizationId = :organizationId', {
        organizationId,
      });
    }

    const user = await this.applyUserSelect(query).getOne();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Obtener todos los usuarios
   * @returns Lista de todos los usuarios
   */
  async findAll(): Promise<Partial<UserEntity>[]> {
    return this.applyUserSelect(
      this.buildUserQuery()
        .leftJoinAndSelect('user.organization', 'organization'),
      this.USER_LIST_FIELDS,
    )
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Obtener usuarios de una organización (alias para listByOrganization)
   * @param organizationId - ID de la organización
   * @returns Lista de usuarios
   */
  async findByOrganization(organizationId: string): Promise<Partial<UserEntity>[]> {
    return this.listByOrganization(organizationId);
  }

  /**
   * Actualizar usuario
   * @param userId - ID del usuario
   * @param organizationId - Opcional: ID de la organización
   * @param updateUserDto - Datos a actualizar
   * @returns Usuario actualizado
   */
  async updateUser(
    userId: string,
    organizationId: string | undefined,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserEntity>> {
    try {
      let query = this.buildUserQuery().where('user.id = :userId', { userId });

      if (organizationId) {
        query = query.andWhere('user.organizationId = :organizationId', {
          organizationId,
        });
      }

      const user = await query.getOne();

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar si el correo ya está registrado por otro usuario
      if (updateUserDto.email) {
        const sanitizedNewEmail = this.sanitizeEmail(updateUserDto.email);
        if (sanitizedNewEmail !== user.email) {
          const existingUser = await this.buildUserQuery()
            .where('user.email = :email', { email: sanitizedNewEmail })
            .getOne();

          if (existingUser) {
            throw new ConflictException('El correo electrónico ya está registrado');
          }
        }

        user.email = sanitizedNewEmail;
      }

      // Actualizar campos
      if (updateUserDto.firstName) {
        user.firstName = this.sanitizeName(updateUserDto.firstName);
      }
      if (updateUserDto.lastName) {
        user.lastName = this.sanitizeName(updateUserDto.lastName);
      }
      if (updateUserDto.role) {
        user.role = updateUserDto.role;
      }
      if (updateUserDto.isActive !== undefined) {
        user.isActive = updateUserDto.isActive;
      }

      await this.usersRepository.save(user);
      this.logger.log(`Usuario actualizado: ${user.email}`);

      return await this.findOne(userId, organizationId);
    } catch (error) {
      this.logger.error(
        `Error al actualizar usuario: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Desactivar usuario
   * @param userId - ID del usuario
   * @param organizationId - ID de la organización
   */
  async deactivate(userId: string, organizationId: string): Promise<void> {
    const user = await this.buildUserQuery()
      .where('user.id = :userId AND user.organizationId = :organizationId', {
        userId,
        organizationId,
      })
      .getOne();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = false;
    await this.usersRepository.save(user);
    this.logger.log(`Usuario ${user.email} desactivado`);
  }

  /**
   * Reactivar usuario
   * @param userId - ID del usuario
   * @param organizationId - ID de la organización
   * @returns Usuario reactivado
   */
  async activate(
    userId: string,
    organizationId: string,
  ): Promise<Partial<UserEntity>> {
    const user = await this.buildUserQuery()
      .where('user.id = :userId AND user.organizationId = :organizationId', {
        userId,
        organizationId,
      })
      .getOne();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = true;
    await this.usersRepository.save(user);
    this.logger.log(`Usuario ${user.email} reactivado`);

    return await this.findOne(userId, organizationId);
  }

  /**
   * Eliminar usuario
   * @param id - ID del usuario a eliminar
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.buildUserQuery()
        .where('user.id = :id', { id })
        .getOne();

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      await this.usersRepository.remove(user);
      this.logger.log(`Usuario eliminado: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error al eliminar usuario: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Validar contraseña
   * @param plainPassword - Contraseña en texto plano
   * @param hashedPassword - Contraseña hasheada
   * @returns true si coinciden
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hashear contraseña
   * @param password - Contraseña a hashear
   * @returns Contraseña hasheada
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
}

