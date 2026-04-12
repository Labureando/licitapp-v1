/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'winston';

/**
 * Formato estándar de error
 */
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Filtro global de excepciones HTTP
 * Captura y formatea todas las excepciones HTTP de la aplicación
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional() @Inject('WINSTON_MODULE_PROVIDER') private logger?: Logger
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extraer mensaje de la excepción
    let message: string | string[] = 'Internal server error';
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      message =
        (exceptionResponse as any).message || exceptionResponse.toString();
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: HttpStatus[status] || 'Unknown Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Loguear el error (especialmente los 5xx)
    const logMessage = `[${request.method}] ${request.url} - ${status}`;
    if (this.logger) {
      if (status >= 500) {
        this.logger.error(logMessage, exception.stack);
      } else {
        this.logger.warn(`${logMessage} - ${JSON.stringify(message)}`);
      }
    } else {
      // Fallback a console si logger no está disponible
      if (status >= 500) {
        console.error(logMessage, exception.stack);
      } else {
        console.warn(`${logMessage} - ${JSON.stringify(message)}`);
      }
    }

    response.status(status).json(errorResponse);
  }
}
