import {
  Injectable,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../entities';
import { Plan, Role, Timezone } from '../enums';
import { UserSanitizeHelper } from '../helpers';
import { UserAuthService } from './user-auth.service';

@Injectable()
export class UserSignupService {
  private readonly logger = new Logger(UserSignupService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly sanitizeHelper: UserSanitizeHelper,
    private readonly authService: UserAuthService,
  ) {}

  /**
   * Crear usuario incompleto (sin contraseña) para 2-step signup
   */
  async createIncompleteUser(signupData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    timezone?: string;
  }): Promise<UserEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sanitizedEmail = this.sanitizeHelper.sanitizeEmail(signupData.email);

      // Verificar si el correo ya existe
      const existingUser = await queryRunner.manager.findOne(UserEntity, {
        where: { email: sanitizedEmail },
      });

      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // Generar token único de 32 bytes
      const signupToken = require('crypto').randomBytes(32).toString('hex');
      const signupTokenExpiresAt = new Date();
      signupTokenExpiresAt.setHours(signupTokenExpiresAt.getHours() + 24);

      // Generar contraseña temporal
      const tempPassword = require('crypto').randomBytes(32).toString('hex');
      const hashedTempPassword = await this.authService.hashPassword(tempPassword);

      // Crear usuario INACTIVO
      const user = queryRunner.manager.create(UserEntity, {
        email: sanitizedEmail,
        firstName: this.sanitizeHelper.sanitizeName(signupData.firstName),
        lastName: this.sanitizeHelper.sanitizeName(signupData.lastName),
        phone: signupData.phone,
        timezone: (signupData.timezone || Timezone.UTC) as Timezone,
        password: hashedTempPassword,
        role: Role.PUBLIC_USER,
        userPlan: Plan.FREE,
        isActive: false,
        signupToken,
        signupTokenExpiresAt,
      });

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      this.logger.log(`Usuario incompleto creado: ${savedUser.email}`);

      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al crear usuario incompleto: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Completar signup con contraseña
   */
  async completeSignupWithPassword(
    token: string,
    password: string,
    passwordConfirm: string,
  ): Promise<UserEntity> {
    try {
      // Validar que las contraseñas coincidan
      if (password !== passwordConfirm) {
        throw new BadRequestException('Las contraseñas no coinciden');
      }

      // Validar longitud mínima
      if (password.length < 8) {
        throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
      }

      // Buscar usuario por token
      const user = await this.usersRepository.findOne({
        where: { signupToken: token },
      });

      if (!user) {
        throw new BadRequestException('Token de signup inválido o expirado');
      }

      // Validar que el token no haya expirado
      if (!user.signupTokenExpiresAt || new Date() > user.signupTokenExpiresAt) {
        throw new BadRequestException('El token de signup ha expirado');
      }

      // Hashear contraseña
      const hashedPassword = await this.authService.hashPassword(password);

      // Actualizar usuario
      user.password = hashedPassword;
      user.isActive = true;
      user.signupToken = undefined;
      user.signupTokenExpiresAt = undefined;

      const savedUser = await this.usersRepository.save(user);

      this.logger.log(`Signup completado para: ${user.email}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error al completar signup: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
