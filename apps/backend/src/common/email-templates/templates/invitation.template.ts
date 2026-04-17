/**
 * Template para email de invitación a organización
 * @param organizationName - Nombre de la organización
 * @param token - Token de invitación
 * @param expiresAt - Fecha de expiración del token
 * @returns HTML del email
 */
export function invitationTemplate(
  organizationName: string,
  token: string,
  expiresAt: Date,
): string {
  const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/${token}/accept`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Invitación a Unirte</h2>
      
      <p>¡Hola!,</p>
      
      <p>Has sido invitado a unirte a <strong style="color: #007bff;">${organizationName}</strong> en LicitApp.</p>
      
      <p style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; margin: 20px 0;">
        Tu equipo te está esperando. Aceptar esta invitación te permitirá colaborar y acceder a los datos compartidos.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Aceptar Invitación
        </a>
      </div>
      
      <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <strong style="color: #ff9800;">⏰ Este enlace expira el ${expiresAt.toLocaleString('es-ES')}</strong>
      </p>
      
      <p style="color: #666; margin-top: 30px; word-break: break-all;">
        O copia este enlace en tu navegador: <br>
        <code style="background-color: #f5f5f5; padding: 8px; border-radius: 3px; font-size: 12px;">${acceptUrl}</code>
      </p>
      
      <p style="color: #999; margin-top: 30px;">
        Si no esperabas esta invitación, puedes ignorar este email de manera segura.
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        © 2026 LicitApp. Todos los derechos reservados.
      </p>
    </div>
  `;
}
