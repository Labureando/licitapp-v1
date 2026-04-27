import { AlertEntity } from '../../modules/alerts/entities/alert.entity';
import { Licitacion } from '../../modules/scraping/shared/entities/licitacion.entity';

/**
 * Generar HTML del email de digest diario de alertas
 * Muestra hasta 10 licitaciones que coinciden con los criterios de la alerta
 */
export function generateAlertDigestEmailTemplate(
  alert: AlertEntity,
  licitaciones: Licitacion[],
  totalFound: number,
): string {
  const firstName = alert.user?.firstName || 'Usuario';
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const licitacionesHtml = licitaciones.map((lic, index) => {
    const presupuesto = lic.presupuestoBase
      ? `€${parseInt(lic.presupuestoBase).toLocaleString('es-ES')}`
      : 'No especificado';
    const plazo = lic.fechaPresentacion
      ? new Date(lic.fechaPresentacion).toLocaleDateString('es-ES')
      : 'No especificado';
    const publicada = lic.fechaPublicacion
      ? new Date(lic.fechaPublicacion).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null;
    const estadoBadgeColor =
      lic.estado === 'ABIERTA' ? '#2e7d32' : lic.estado === 'ADJUDICADA' ? '#1565c0' : '#555';

    // Las 3 primeras llevan borde naranja para destacar las más recientes
    const borderColor = index < 3 ? '#e65100' : '#0066cc';
    const isNew = index < 3;

    return `
      <div style="background:#fff;border:1px solid #e0e0e0;border-left:4px solid ${borderColor};border-radius:6px;padding:18px 20px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
          <div>
            ${isNew ? `<span style="display:inline-block;background:#fff3e0;color:#e65100;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;border:1px solid #ffcc80;margin-right:6px;letter-spacing:0.5px;">🆕 NUEVA</span>` : ''}
            <span style="display:inline-block;background:${estadoBadgeColor};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:3px;letter-spacing:0.5px;">${escapeHtml(lic.estado)}</span>
          </div>
          ${publicada ? `<span style="font-size:11px;color:#888;">Publicada: <strong>${publicada}</strong></span>` : ''}
        </div>
        <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;color:${borderColor};line-height:1.4;">${escapeHtml(lic.title)}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#555;">
          <tr>
            <td style="padding:3px 8px 3px 0;width:50%;">
              <span style="color:#0066cc;font-weight:600;">Presupuesto: </span>${presupuesto}
            </td>
            <td style="padding:3px 0;width:50%;">
              <span style="color:#0066cc;font-weight:600;">Plazo: </span>${plazo}
            </td>
          </tr>
          <tr>
            <td style="padding:3px 8px 3px 0;">
              <span style="color:#0066cc;font-weight:600;">Tipo: </span>${escapeHtml(lic.tipoContrato || 'No especificado')}
            </td>
            <td style="padding:3px 0;">
              <span style="color:#0066cc;font-weight:600;">CCAA: </span>${escapeHtml(lic.ccaa || 'No especificada')}
            </td>
          </tr>
          ${lic.provincia ? `<tr><td colspan="2" style="padding:3px 0;"><span style="color:#0066cc;font-weight:600;">Provincia: </span>${escapeHtml(lic.provincia)}</td></tr>` : ''}
        </table>
        ${lic.description ? `<p style="margin:10px 0 0;font-size:12px;color:#777;line-height:1.5;border-top:1px solid #f0f0f0;padding-top:10px;">${escapeHtml(lic.description.substring(0, 200))}${lic.description.length > 200 ? '…' : ''}</p>` : ''}
      </div>
    `;
  }).join('');

  const moreBadge =
    totalFound > licitaciones.length
      ? `<p style="text-align:center;color:#666;font-size:13px;margin:8px 0 0;">
           Y <strong>${totalFound - licitaciones.length}</strong> licitaciones más que cumplen tus criterios.
         </p>`
      : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:620px;margin:0 auto;padding:24px 16px;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0066cc 0%,#0052a3 100%);color:#fff;padding:28px 30px;border-radius:8px 8px 0 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;opacity:0.85;text-transform:uppercase;letter-spacing:1px;">${today}</p>
          <h2 style="margin:0;font-size:22px;font-weight:700;">📋 Tu resumen diario de licitaciones</h2>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Alerta: <strong>${escapeHtml(alert.name)}</strong></p>
        </div>

        <!-- Body -->
        <div style="background:#f9f9f9;padding:24px 24px 28px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 20px;font-size:15px;color:#333;">
            Hola <strong>${firstName}</strong>, hemos encontrado <strong>${totalFound}</strong> licitación${totalFound !== 1 ? 'es' : ''} que coincide${totalFound === 1 ? '' : 'n'} con tu alerta hoy.
            ${totalFound === 0 ? '<br><em style="color:#888;">No hay licitaciones nuevas para tus criterios hoy.</em>' : ''}
          </p>

          ${licitacionesHtml}
          ${moreBadge}

          <!-- CTA -->
          <div style="text-align:center;margin-top:24px;">
            <a href="#" style="display:inline-block;background:#0066cc;color:#fff;padding:12px 32px;border-radius:5px;text-decoration:none;font-weight:600;font-size:14px;">
              Ver todas en LicitApp →
            </a>
          </div>

          <!-- Footer -->
          <div style="margin-top:28px;padding-top:18px;border-top:1px solid #ddd;text-align:center;font-size:11px;color:#aaa;line-height:1.8;">
            <p style="margin:0;">Recibes este email porque tienes activa la alerta <em>"${escapeHtml(alert.name)}"</em> en LicitApp.</p>
            <p style="margin:0;">Puedes gestionar o desactivar tus alertas desde tu panel de control.</p>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
}

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
