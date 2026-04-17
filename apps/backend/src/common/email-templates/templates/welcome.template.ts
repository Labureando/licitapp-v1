/**
 * Template para email de bienvenida a nuevo miembro
 * @param organizationName - Nombre de la organización
 * @returns HTML del email
 */
export function welcomeTemplate(organizationName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">¡Bienvenido a LicitApp!</h2>
      
      <p>¡Hola!,</p>
      
      <p>Tu cuenta ha sido creada correctamente como miembro de <strong style="color: #28a745;">${organizationName}</strong>.</p>
      
      <p style="background-color: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; color: #155724; margin: 20px 0;">
        <strong>✓ Bienvenido al equipo</strong> - Ahora tienes acceso a todos los recursos compartidos con ${organizationName}.
      </p>
      
      <p style="margin-top: 30px;">Puedes comenzar a:</p>
      <ul style="color: #666;">
        <li>Buscar y monitorear licitaciones</li>
        <li>Crear alertas personalizadas</li>
        <li>Colaborar con tu equipo</li>
        <li>Acceder a análisis y reportes</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Acceder a LicitApp
        </a>
      </div>
      
      <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 30px;">
        <strong>📱 Necesitas ayuda?</strong><br>
        Consulta nuestra documentación o contacta con el equipo de soporte si tienes preguntas.
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        © 2026 LicitApp. Todos los derechos reservados.
      </p>
    </div>
  `;
}
