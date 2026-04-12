/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import * as winston from 'winston';
import { config } from './env.config';

/**
 * Colores personalizados para Winston
 */
const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

/**
 * Formato personalizado para los logs
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const stackTrace = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message}${stackTrace}`;
  })
);

/**
 * Transportes para desarrollo
 */
const devTransports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ colors: customColors }),
      customFormat
    ),
  }),
];

/**
 * Transportes para producción
 */
const prodTransports = [
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: customFormat,
  }),
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: customFormat,
  }),
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ colors: customColors }),
      customFormat
    ),
  }),
];

/**
 * Configuración de Winston para NestJS WinstonModule
 */
export const winstonConfig = {
  transports: config.nodeEnv === 'production' ? prodTransports : devTransports,
  level: config.nodeEnv === 'development' ? 'debug' : 'warn',
};
