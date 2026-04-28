import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import {
  SendEmailDto,
  SendEmailWithTemplateDto,
} from './email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY not found in environment variables');
    }

    sgMail.setApiKey(apiKey || '');
    this.from = this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      'noreply@licitapp.com',
    );
  }

  /**
   * Send a simple email
   */
  async sendEmail(emailDto: SendEmailDto): Promise<void> {
    try {
      const msg = {
        to: emailDto.to,
        from: emailDto.from || this.from,
        subject: emailDto.subject,
        text: emailDto.text,
        html: emailDto.html,
        replyTo: emailDto.replyTo,
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent to ${Array.isArray(emailDto.to) ? emailDto.to.join(', ') : emailDto.to}`);
    } catch (error) {
      // Loguear respuesta detallada de SendGrid si está disponible
      const sgResponse = error?.response?.body;
      this.logger.error(
        `Failed to send email to ${Array.isArray(emailDto.to) ? emailDto.to.join(', ') : emailDto.to}: ${error.message}`,
        sgResponse ? JSON.stringify(sgResponse) : error.stack,
      );
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send an email using SendGrid dynamic templates
   */
  async sendEmailWithTemplate(
    emailDto: SendEmailWithTemplateDto,
  ): Promise<void> {
    try {
      const msg = {
        to: emailDto.to,
        from: emailDto.from || this.from,
        templateId: emailDto.template.templateId,
        dynamicTemplateData: emailDto.template.dynamicTemplateData,
      };

      await sgMail.send(msg);
      this.logger.log(
        `Template email sent to ${Array.isArray(emailDto.to) ? emailDto.to.join(', ') : emailDto.to} with template ${emailDto.template.templateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send template email: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <h1>Bienvenido a LicitApp, ${firstName}!</h1>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <p>Haz clic en el siguiente enlace para confirmar tu email:</p>
      <a href="${this.configService.get<string>('APP_URL')}/verify-email">Confirmar email</a>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Bienvenido a LicitApp',
      html,
      text: `Bienvenido a LicitApp, ${firstName}!`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('APP_URL')}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Restablecer contraseña</h1>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}">Restablecer contraseña</a>
      <p>Este enlace expira en 1 hora.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Restablecer tu contraseña en LicitApp',
      html,
      text: 'Haz clic en el enlace para restablecer tu contraseña',
    });
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(
    email: string,
    organizationName: string,
    inviteToken: string,
  ): Promise<void> {
    const inviteUrl = `${this.configService.get<string>('APP_URL')}/join-organization?token=${inviteToken}`;

    const html = `
      <h1>Invitación a unirse a ${organizationName}</h1>
      <p>Has sido invitado a unirte a ${organizationName} en LicitApp.</p>
      <p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
      <a href="${inviteUrl}">Aceptar invitación</a>
    `;

    await this.sendEmail({
      to: email,
      subject: `Invitación a unirse a ${organizationName}`,
      html,
      text: `Has sido invitado a unirte a ${organizationName}`,
    });
  }
}
