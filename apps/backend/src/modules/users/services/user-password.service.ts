import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';
import { EmailService } from '../../../infrastructure/email';
import { EmailTemplatesService } from '../../../common/email-templates';
import { UserQueryHelper, UserSanitizeHelper } from '../helpers';
import { UserAuthService } from './user-auth.service';

@Injectable()
export class UserPasswordService {
  private readonly logger = new Logger(UserPasswordService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly queryHelper: UserQueryHelper,
    private readonly sanitizeHelper: UserSanitizeHelper,
    private readonly authService: UserAuthService,
  ) {}

  /**
   * Solicitar cambio de contraseña por email
   */
  async requestPasswordChange(email: string): Promise<{ message: string }> {
    try {
      const sanitizedEmail = this.sanitizeHelper.sanitizeEmail(email);

      const user = await this.queryHelper
        .buildUserQuery(this.usersRepository)
        .where('user.email = :email', { email: sanitizedEmail })
        .getOne();

      if (!user) {
        this.logger.warn(`Password reset request para email no existente: ${sanitizedEmail}`);
        return { message: 'Si el email existe, recibirás un enlace para cambiar tu contraseña' };
      }

      // Generar token único
      const token = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Guardar token en BD
      user.passwordResetToken = token;
      user.passwordResetExpiresAt = expiresAt;
      await this.usersRepository.save(user);

      // Enviar email
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
      const emailHtml = this.emailTemplatesService.getPasswordResetTemplate(
        user.firstName,
        resetLink,
        expiresAt,
      );
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Solicitud de cambio de contraseña - LicitApp',
        html: emailHtml,
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
   */
  async confirmPasswordChange(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.queryHelper
        .buildUserQuery(this.usersRepository)
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
      const hashedPassword = await this.authService.hashPassword(newPassword);

      // Actualizar usuario
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpiresAt = undefined;
      await this.usersRepository.save(user);

      // Enviar email de confirmación
      const emailHtml = this.emailTemplatesService.getPasswordChangedTemplate(user.firstName);
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Contraseña actualizada - LicitApp',
        html: emailHtml,
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
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string,
  ): Promise<{ message: string }> {
    try {
      // Validar que ambas contraseñas coincidan
      if (newPassword !== newPasswordConfirm) {
        throw new BadRequestException('Las contraseñas no coinciden');
      }

      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.id = :userId', { userId })
        .addSelect('user.password')
        .getOne();

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Validar contraseña anterior
      const isPasswordValid = await this.authService.validatePassword(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      // Hashear nueva contraseña
      const hashedPassword = await this.authService.hashPassword(newPassword);

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
}
