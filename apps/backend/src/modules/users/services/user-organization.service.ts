import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity, OrganizationEntity } from '../entities';
import { Role, Plan } from '../enums';
import { EmailService } from '../../../infrastructure/email';
import { UserSanitizeHelper } from '../helpers';
import { UserAuthService } from './user-auth.service';

@Injectable()
export class UserOrganizationService {
  private readonly logger = new Logger(UserOrganizationService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationsRepository: Repository<OrganizationEntity>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly sanitizeHelper: UserSanitizeHelper,
    private readonly authService: UserAuthService,
  ) {}

  /**
   * Promover usuario PUBLIC_USER a ORG_OWNER
   */
  async promoteToOrgOwner(
    userId: string,
    organizationId: string,
  ): Promise<UserEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(UserEntity, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (user.role !== Role.PUBLIC_USER) {
        throw new BadRequestException(
          `Solo usuarios PUBLIC_USER pueden ser promovidos. Usuario actual es ${user.role}`,
        );
      }

      if (user.organizationId) {
        throw new BadRequestException(
          'El usuario ya pertenece a una organización. No puede crear otra.',
        );
      }

      const organization = await queryRunner.manager.findOne(OrganizationEntity, {
        where: { id: organizationId },
      });

      if (!organization) {
        throw new NotFoundException('Organización no encontrada');
      }

      user.role = Role.ORG_OWNER;
      user.organizationId = organizationId;
      user.userPlan = undefined;

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

  /**
   * Crear usuario con Google OAuth (sin contraseña)
   */
  async createUserWithGoogle(googleUserData: {
    google_id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: Role;
    userPlan?: Plan;
  }): Promise<UserEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sanitizedEmail = this.sanitizeHelper.sanitizeEmail(googleUserData.email);

      const existingUser = await queryRunner.manager.findOne(UserEntity, {
        where: { email: sanitizedEmail },
      });

      if (existingUser) {
        throw new ConflictException(
          'El correo electrónico ya está registrado. Por favor, inicia sesión con tu método de autenticación actual.',
        );
      }

      const randomPassword = require('crypto').randomBytes(32).toString('hex');
      const hashedPassword = await this.authService.hashPassword(randomPassword);

      const user = queryRunner.manager.create(UserEntity, {
        google_id: googleUserData.google_id,
        email: sanitizedEmail,
        firstName: this.sanitizeHelper.sanitizeName(googleUserData.firstName),
        lastName: this.sanitizeHelper.sanitizeName(googleUserData.lastName),
        password: hashedPassword,
        role: googleUserData.role || Role.PUBLIC_USER,
        userPlan: googleUserData.userPlan || Plan.FREE,
        isActive: true,
      });

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      this.logger.log(`Usuario creado vía Google OAuth: ${savedUser.email}`);

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
      }

      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al crear usuario con Google OAuth: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
