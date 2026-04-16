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
import { Role, Plan } from './enums';
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

      // Validación de planes y organización
      let organizationId = createUserDto.organizationId;
      let userPlan: Plan | undefined;
      
      if (createUserDto.organizationId) {
        // Si tiene organizationId, userPlan será undefined (hereda del org)
        userPlan = undefined;
      } else {
        // Si no tiene organizationId, userPlan debe ser válido
        userPlan = createUserDto.userPlan || Plan.FREE;
      }

      // Si se proporciona organizationId
      if (organizationId) {
        const organization = await queryRunner.manager.findOne(OrganizationEntity, {
          where: { id: organizationId },
        });

        if (!organization) {
          throw new BadRequestException('La organización no existe');
        }

        // Verificar límites de usuarios en la organización si no es SUPER_ADMIN
        if (createUserDto.role !== Role.SUPER_ADMIN && createUserDto.role !== Role.ORG_OWNER) {
          const userCount = await queryRunner.manager.count(UserEntity, {
            where: { organizationId: organizationId },
          });
          // TODO: Integrar LimitsService para validar límites según plan
        }
      } else {
        // Si NO tiene organizationId, debe ser PUBLIC_USER
        if (createUserDto.role && createUserDto.role !== Role.PUBLIC_USER) {
          throw new BadRequestException(
            'Solo PUBLIC_USER puede no pertenecer a una organización. Para ORG_OWNER/ORG_MEMBER se requiere organizationId.',
          );
        }

        // PUBLIC_USER sin org debe tener un plan válido (FREE, PRO, ADVANCED)
        if (!userPlan || ![Plan.FREE, Plan.PRO, Plan.ADVANCED].includes(userPlan)) {
          throw new BadRequestException(
            `Plan no válido para usuario individual. Debe ser: ${Plan.FREE}, ${Plan.PRO}, o ${Plan.ADVANCED}`,
          );
        }
      }

      // Hashear contraseña
      const hashedPassword = await this.hashPassword(createUserDto.password);

      // Crear usuario
      const user = queryRunner.manager.create(UserEntity, {
        email: sanitizedEmail,
        firstName: this.sanitizeName(createUserDto.firstName),
        lastName: this.sanitizeName(createUserDto.lastName),
        phone: createUserDto.phone,
        timezone: createUserDto.timezone,
        password: hashedPassword,
        role: createUserDto.role || Role.PUBLIC_USER,
        userPlan: userPlan,
        organizationId: organizationId || undefined,
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

  // ============ MÉTODOS DE PROMOCIÓN DE ROLES ============

  /**
   * Promover usuario PUBLIC_USER a ORG_OWNER
   * Se ejecuta automáticamente cuando un PUBLIC_USER crea su primera organización
   * 
   * Validaciones:
   * - Usuario debe ser PUBLIC_USER
   * - Usuario no debe estar en otra organización
   * - La organización debe existir
   * 
   * @param userId - ID del usuario a promover
   * @param organizationId - ID de la organización a la que será propietario
   * @returns Usuario con nuevo rol ORG_OWNER
   */
  async promoteToOrgOwner(
    userId: string,
    organizationId: string,
  ): Promise<UserEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener usuario actual
      const user = await queryRunner.manager.findOne(UserEntity, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Validar que es PUBLIC_USER
      if (user.role !== Role.PUBLIC_USER) {
        throw new BadRequestException(
          `Solo usuarios PUBLIC_USER pueden ser promovidos. Usuario actual es ${user.role}`,
        );
      }

      // Validar que no está en otra organización
      if (user.organizationId) {
        throw new BadRequestException(
          'El usuario ya pertenece a una organización. No puede crear otra.',
        );
      }

      // Validar que la organización existe
      const organization = await queryRunner.manager.findOne(OrganizationEntity, {
        where: { id: organizationId },
      });

      if (!organization) {
        throw new NotFoundException('Organización no encontrada');
      }

      // Actualizar usuario: cambiar rol a ORG_OWNER y asignar a la organización
      user.role = Role.ORG_OWNER;
      user.organizationId = organizationId;
      user.userPlan = undefined; // Ya no es relevante para ORG_OWNER

      const promotedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Usuario ${user.email} promovido a ORG_OWNER de organización ${organizationId}`,
      );

      return promotedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al promover usuario: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ MÉTODOS DE CAMBIO DE CONTRASEÑA ============

  /**
   * Solicitar cambio de contraseña por email
   * Genera un token único y envía un email con link para cambiar password
   * @param email - Email del usuario
   * @returns Confirmación de email enviado
   */
  async requestPasswordChange(email: string): Promise<{ message: string }> {
    try {
      const sanitizedEmail = this.sanitizeEmail(email);

      const user = await this.buildUserQuery()
        .where('user.email = :email', { email: sanitizedEmail })
        .getOne();

      if (!user) {
        // No revelar si el email existe (seguridad)
        this.logger.warn(`Password reset request para email no existente: ${sanitizedEmail}`);
        return { message: 'Si el email existe, recibirás un enlace para cambiar tu contraseña' };
      }

      // Generar token único
      const token = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token válido por 1 hora

      // Guardar token en BD
      user.passwordResetToken = token;
      user.passwordResetExpiresAt = expiresAt;
      await this.usersRepository.save(user);

      // Enviar email
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Solicitud de cambio de contraseña - LicitApp',
        html: this.generatePasswordResetEmailHtml(user.firstName, resetLink, expiresAt),
      });

      this.logger.log(`Email de cambio de contraseña enviado a: ${user.email}`);
      return { message: 'Si el email existe, recibirás un enlace para cambiar tu contraseña' };
    } catch (error) {
      this.logger.error(
        `Error al solicitar cambio de password: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Confirmar cambio de contraseña usando token
   * Valida el token y cambia la contraseña
   * @param token - Token enviado por email
   * @param newPassword - Nueva contraseña
   * @returns Confirmación de cambio
   */
  async confirmPasswordChange(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.buildUserQuery()
        .where('user.passwordResetToken = :token', { token })
        .getOne();

      if (!user) {
        throw new BadRequestException('Token de cambio de contraseña inválido o expirado');
      }

      // Validar que el token no haya expirado
      if (!user.passwordResetExpiresAt || new Date() > user.passwordResetExpiresAt) {
        throw new BadRequestException('El token de cambio de contraseña ha expirado');
      }

      // Hashear nueva contraseña
      const hashedPassword = await this.hashPassword(newPassword);

      // Actualizar usuario
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpiresAt = undefined;
      await this.usersRepository.save(user);

      // Enviar email de confirmación
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Contraseña actualizada - LicitApp',
        html: this.generatePasswordChangedEmailHtml(user.firstName),
      });

      this.logger.log(`Contraseña cambiada exitosamente para: ${user.email}`);
      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      this.logger.error(
        `Error al confirmar cambio de password: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Cambiar contraseña directa (usuario logueado)
   * Requiere validar contraseña anterior
   * @param userId - ID del usuario
   * @param oldPassword - Contraseña actual
   * @param newPassword - Nueva contraseña
   * @returns Confirmación de cambio
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.id = :userId', { userId })
        .addSelect('user.password')
        .getOne();

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Validar contraseña anterior
      const isPasswordValid = await this.validatePassword(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      // Hashear nueva contraseña
      const hashedPassword = await this.hashPassword(newPassword);

      // Actualizar
      user.password = hashedPassword;
      await this.usersRepository.save(user);

      this.logger.log(`Contraseña cambiada para usuario: ${user.email}`);
      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      this.logger.error(
        `Error al cambiar password: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Genera HTML para email de reset de contraseña
   */
  private generatePasswordResetEmailHtml(
    firstName: string,
    resetLink: string,
    expiresAt: Date,
  ): string {
    return `
      <h2>Cambio de Contraseña</h2>
      <p>Hola ${firstName},</p>
      <p>Recibimos una solicitud para cambiar tu contraseña en LicitApp.</p>
      <p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
      <p>
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Cambiar Contraseña
        </a>
      </p>
      <p><strong>Este enlace expira el ${expiresAt.toLocaleString('es-ES')}</strong></p>
      <p>Si no solicitaste este cambio, ignora este email.</p>
    `;
  }

  /**
   * Genera HTML para email de confirmación de cambio de contraseña
   */
  private generatePasswordChangedEmailHtml(firstName: string): string {
    return `
      <h2>Contraseña Actualizada</h2>
      <p>Hola ${firstName},</p>
      <p>Tu contraseña ha sido actualizada exitosamente.</p>
      <p>Si no realizaste este cambio, contacta con nosotros inmediatamente.</p>
      <p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Volver a LicitApp
        </a>
      </p>
    `;
  }
}

