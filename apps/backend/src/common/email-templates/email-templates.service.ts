/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import {
  passwordResetTemplate,
  passwordChangedTemplate,
  invitationTemplate,
  welcomeTemplate,
  getSignupVerificationTemplate,
} from './templates';

@Injectable()
export class EmailTemplatesService {
  /**
   * Template para email de solicitud de cambio de contraseña
   * @param firstName - Nombre del usuario
   * @param resetLink - Link para cambiar contraseña
   * @param expiresAt - Fecha de expiración del token
   * @returns HTML del email
   */
  getPasswordResetTemplate(
    firstName: string,
    resetLink: string,
    expiresAt: Date,
  ): string {
    return passwordResetTemplate(firstName, resetLink, expiresAt);
  }

  /**
   * Template para email de confirmación de cambio de contraseña
   * @param firstName - Nombre del usuario
   * @returns HTML del email
   */
  getPasswordChangedTemplate(firstName: string): string {
    return passwordChangedTemplate(firstName);
  }

  /**
   * Template para email de invitación a organización
   * @param organizationName - Nombre de la organización
   * @param token - Token de invitación
   * @param expiresAt - Fecha de expiración del token
   * @returns HTML del email
   */
  getInvitationTemplate(
    organizationName: string,
    token: string,
    expiresAt: Date,
  ): string {
    return invitationTemplate(organizationName, token, expiresAt);
  }

  /**
   * Template para email de bienvenida a usuario nuevo
   * @param organizationName - Nombre de la organización
   * @returns HTML del email
   */
  getWelcomeTemplate(organizationName: string): string {
    return welcomeTemplate(organizationName);
  }

  /**
   * Template para email de verificación de signup
   * @param firstName - Nombre del usuario
   * @param verificationLink - Link para completar el signup
   * @param expiresAt - Fecha de expiración del token
   * @returns HTML del email
   */
  getSignupVerificationTemplate(
    firstName: string,
    verificationLink: string,
    expiresAt: Date,
  ): string {
    return getSignupVerificationTemplate(firstName, verificationLink, expiresAt);
  }
}
