/**
 * Template para email de solicitud de cambio de contraseña
 * @param firstName - Nombre del usuario
 * @param resetLink - Link para cambiar contraseña
 * @param expiresAt - Fecha de expiración del token
 * @returns HTML del email
 */
export function passwordResetTemplate(
  firstName: string,
  resetLink: string,
  expiresAt: Date,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Cambio de Contraseña</h2>
      
      <p>Hola <strong>${firstName}</strong>,</p>
      
      <p>Recibimos una solicitud para cambiar tu contraseña en LicitApp.</p>
      
      <p style="margin: 30px 0;">Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Cambiar Contraseña
        </a>
      </div>
      
      <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <strong style="color: #ff9800;">⏰ Este enlace expira el ${expiresAt.toLocaleString('es-ES')}</strong>
      </p>
      
      <p style="color: #666; margin-top: 30px;">
        Si no solicitaste este cambio, ignora este email y tu contraseña permanecerá segura.
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        © 2026 LicitApp. Todos los derechos reservados.
      </p>
    </div>
  `;
}
