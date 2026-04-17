/**
 * Template para email de confirmación de cambio de contraseña
 * @param firstName - Nombre del usuario
 * @returns HTML del email
 */
export function passwordChangedTemplate(firstName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">✓ Contraseña Actualizada</h2>
      
      <p>Hola <strong>${firstName}</strong>,</p>
      
      <p>Tu contraseña ha sido actualizada exitosamente.</p>
      
      <p style="background-color: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; color: #155724;">
        <strong>✓ Cambio completado correctamente</strong>
      </p>
      
      <p style="margin-top: 30px;">Ahora puedes acceder a LicitApp con tu nueva contraseña.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Volver a LicitApp
        </a>
      </div>
      
      <p style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; color: #721c24; margin-top: 30px;">
        <strong>⚠️ Importante:</strong> Si no realizaste este cambio, contacta con nosotros inmediatamente.
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        © 2026 LicitApp. Todos los derechos reservados.
      </p>
    </div>
  `;
}
