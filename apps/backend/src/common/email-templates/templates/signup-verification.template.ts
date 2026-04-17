import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function getSignupVerificationTemplate(
  firstName: string,
  verificationLink: string,
  expiresAt: Date,
): string {
  const expiresIn = formatDistanceToNow(expiresAt, { locale: es, addSuffix: true });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Completa tu Registro - LicitApp</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: #f9f9f9;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
            }
            .content {
                background: white;
                padding: 30px;
                border-radius: 0 0 8px 8px;
            }
            .btn {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .btn:hover {
                background: #764ba2;
            }
            .footer {
                color: #666;
                font-size: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                color: #856404;
            }
            h2 {
                color: #667eea;
                margin-bottom: 15px;
            }
            .step {
                background: #f0f4ff;
                padding: 15px;
                margin: 15px 0;
                border-radius: 4px;
                border-left: 4px solid #667eea;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Bienvenido a LicitApp!</h1>
            </div>
            <div class="content">
                <h2>Hola ${firstName},</h2>

                <p>Tu cuenta está casi lista. Solo falta completar el registro ingresando una contraseña segura.</p>

                <div class="step">
                    <strong>⏱️ Este enlace expira ${expiresIn}</strong>
                </div>

                <h3>Completa tu Registro:</h3>
                <p>Haz clic en el botón de abajo para ingresar tu contraseña y activar tu cuenta.</p>

                <a href="${verificationLink}" class="btn">Completar Registro</a>

                <p>O copia y pega este enlace en tu navegador:</p>
                <p><small style="word-break: break-all; color: #666;">${verificationLink}</small></p>

                <div class="warning">
                    <strong>⚠️ Importante:</strong> No compartas este enlace. Nadie de nuestro equipo te pedirá tu contraseña.
                </div>

                <h3>¿Qué sigue?</h3>
                <ul>
                    <li>Ingresa tu contraseña (mínimo 8 caracteres)</li>
                    <li>Accede a tu cuenta</li>
                    <li>Comienza a buscar licitaciones</li>
                </ul>

                <div class="footer">
                    <p>Este es un mensaje automático. Por favor, no respondas a este correo.</p>
                    <p>Si no solicitaste crear una cuenta en LicitApp, ignora este mensaje.</p>
                    <p>&copy; 2026 LicitApp. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}
