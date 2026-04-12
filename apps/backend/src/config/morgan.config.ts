import { Request, Response } from 'express';
import morgan from 'morgan';
import { config } from './env.config';

/**
 * Expresión personalizada para morgan
 *
 * Formato: :method :url :status :response-time ms - :res[content-length]
 */
const morganFormat =
  ':method :url :status :response-time ms - :res[content-length]';

/**
 * Opciones personalizadas para morgan según el ambiente
 */
const morganOptions: morgan.Options<Request, Response> = {
  skip: (req, res) => {
    // Ignorar solicitudes de healthcheck
    if (req.url === '/health' || req.url === '/healthz') {
      return true;
    }
    // En producción, ignorar solicitudes exitosas (2xx)
    if (config.nodeEnv === 'production' && res.statusCode < 400) {
      return true;
    }
    return false;
  },
  // Colorear output en desarrollo
  immediate: config.nodeEnv === 'development',
};

/**
 * Crear middleware Morgan
 * - Desarrollo: Registra todas las peticiones
 * - Producción: Solo registra errores (4xx y 5xx)
 */
export const morganMiddleware = morgan(morganFormat, morganOptions);

export default morganMiddleware;
