import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { BruteForceService } from '../../services/brute-force.service';

/**
 * Guard para Brute Force Protection
 * Rechaza requests si el IP está bloqueado por demasiados intentos fallidos
 *
 * Uso: @UseGuards(BruteForceGuard)
 */
@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly logger = new Logger(BruteForceGuard.name);

  constructor(private readonly bruteForceService: BruteForceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);

    // Verificar si IP está bloqueado
    const isBlocked = await this.bruteForceService.isBlocked(clientIp);

    if (isBlocked) {
      const attempts = await this.bruteForceService.getAttempts(clientIp);
      this.logger.warn(`🚨 Acceso rechazado para IP bloqueada: ${clientIp}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Demasiados intentos fallidos. Intenta más tarde.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Obtener IP del cliente (considerando proxies)
   */
  private getClientIp(request: Request): string {
    // Buscar en headers de proxy
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const forwardedIps = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0];
      return forwardedIps.trim();
    }

    // Fallback a IP remota
    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
