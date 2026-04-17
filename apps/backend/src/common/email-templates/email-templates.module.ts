import { Module } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';

/**
 * Módulo de Templates de Email
 * Provee plantillas HTML centralizadas para todos los emails de la aplicación
 *
 * Uso:
 * - Importar EmailTemplatesModule en módulos que necesiten enviar emails
 * - Inyectar EmailTemplatesService para acceder a los templates
 *
 * Templates disponibles:
 * - getPasswordResetTemplate: Email para solicitar reset de contraseña
 * - getPasswordChangedTemplate: Confirmación de cambio de contraseña
 * - getInvitationTemplate: Invitación a organización
 * - getWelcomeTemplate: Bienvenida a nuevo miembro
 */
@Module({
  providers: [EmailTemplatesService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
