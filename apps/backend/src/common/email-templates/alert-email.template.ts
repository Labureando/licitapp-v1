import { AlertEntity } from '../../modules/alerts/entities/alert.entity';
import { Licitacion } from '../../modules/scraping/shared/entities/licitacion.entity';

/**
 * Generar HTML del email de alerta de licitación
 * Template limpio y reutilizable para notificaciones de alertas
 * 
 * @param alert - Alerta que se disparó
 * @param licitacion - Licitación que coincide
 * @returns HTML formateado para enviar por email
 */
export function generateAlertEmailTemplate(
  alert: AlertEntity,
  licitacion: Licitacion,
): string {
  const presupuesto = licitacion.presupuestoBase
    ? `€${parseInt(licitacion.presupuestoBase).toLocaleString('es-ES')}`
    : 'No especificado';

  const firstName = alert.user?.firstName || 'Usuario';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 0 0 8px 8px;
        }
        .greeting {
          margin-bottom: 20px;
          font-size: 16px;
        }
        .alert-name {
          display: inline-block;
          background: #e3f2fd;
          color: #0066cc;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 600;
          margin: 0 4px;
        }
        .licitacion-box {
          background: white;
          padding: 20px;
          border-left: 4px solid #0066cc;
          border-radius: 4px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .licitacion-title {
          font-size: 18px;
          font-weight: 600;
          color: #0066cc;
          margin: 0 0 15px 0;
        }
        .licitacion-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .detail-item {
          font-size: 14px;
        }
        .detail-label {
          font-weight: 600;
          color: #0066cc;
          margin-bottom: 4px;
        }
        .detail-value {
          color: #555;
        }
        .description {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e0e0e0;
        }
        .description-label {
          font-weight: 600;
          color: #0066cc;
          margin-bottom: 8px;
        }
        .description-text {
          color: #555;
          line-height: 1.5;
          font-size: 14px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
        .footer-note {
          margin: 0;
          line-height: 1.8;
        }
        .cta-button {
          display: inline-block;
          background: #0066cc;
          color: white;
          padding: 12px 30px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 15px;
          font-size: 14px;
        }
        .cta-button:hover {
          background: #0052a3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 Nueva licitación detectada</h2>
        </div>
        
        <div class="content">
          <div class="greeting">
            <p>Hola <strong>${firstName}</strong>,</p>
            <p>Hemos encontrado una nueva licitación que coincide con tu alerta 
            <span class="alert-name">"${alert.name}"</span></p>
          </div>
          
          <div class="licitacion-box">
            <h3 class="licitacion-title">${escapeHtml(licitacion.title)}</h3>
            
            <div class="licitacion-details">
              <div class="detail-item">
                <div class="detail-label">Estado</div>
                <div class="detail-value">${escapeHtml(licitacion.estado)}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Presupuesto</div>
                <div class="detail-value">${presupuesto}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Tipo de contrato</div>
                <div class="detail-value">${escapeHtml(licitacion.tipoContrato || 'No especificado')}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Comunidad Autónoma</div>
                <div class="detail-value">${escapeHtml(licitacion.ccaa || 'No especificada')}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Procedimiento</div>
                <div class="detail-value">${escapeHtml(licitacion.procedimiento || 'No especificado')}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Provincia</div>
                <div class="detail-value">${escapeHtml(licitacion.provincia || 'No especificada')}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Órgano contratante</div>
                <div class="detail-value">${escapeHtml(licitacion.organoId || 'No especificado')}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Plazo de presentación</div>
                <div class="detail-value">
                  ${licitacion.fechaPresentacion 
                    ? new Date(licitacion.fechaPresentacion).toLocaleDateString('es-ES')
                    : 'No especificado'}
                </div>
              </div>
            </div>
            
            ${
              licitacion.description
                ? `<div class="description">
                     <div class="description-label">Descripción</div>
                     <div class="description-text">${escapeHtml(licitacion.description)}</div>
                   </div>`
                : ''
            }
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="#" class="cta-button">Ver licitación completa</a>
          </div>
          
          <div class="footer">
            <p class="footer-note">
              Esta es una notificación automática de tu alerta en LicitApp.
              <br>
              Puedes gestionar tus alertas en la plataforma o editar tu configuración de notificaciones.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escapar caracteres especiales HTML para evitar inyecciones
 * @param text Texto a escapar
 * @returns Texto escapado seguro para HTML
 */
function escapeHtml(text: string): string {
  if (!text) return '';

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
