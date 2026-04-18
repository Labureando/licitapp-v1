import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../../services/rate-limit.service';

// Metadata key para el decorador
export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Guard para Rate Limiting
 * Rechaza requests si se excede el límite en la ventana de tiempo
 *
 * Se configura con @RateLimit(limit, windowMs)
 * Si no hay configuración, usa valores por defecto
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);
    const endpoint = `${request.method}:${request.path}`;

    // Obtener configuración del decorador
    const config = this.reflector.get<{ limit: number; windowMs: number }>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    const limit = config?.limit ?? 100; // 100 requests por defecto
    const windowMs = config?.windowMs ?? 60 * 1000; // 1 minuto por defecto

    // Verificar si está permitido
    const result = await this.rateLimitService.isAllowed(clientIp, endpoint, limit, windowMs);

    // Agregar headers de rate limit
    if (request.res) {
      request.res.setHeader('X-RateLimit-Limit', limit);
      request.res.setHeader('X-RateLimit-Remaining', result.remaining);
      request.res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    }

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      this.logger.warn(`🚨 Rate Limit excedido para ${endpoint} desde ${clientIp}`);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Demasiadas requests. Intenta en ${retryAfter} segundos.`,
          error: 'Too Many Requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
        {
          cause: {
            'Retry-After': retryAfter.toString(),
          },
        },
      );
    }

    return true;
  }

  /**
   * Obtener IP del cliente (considerando proxies)
   */
  private getClientIp(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const forwardedIps = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0];
      return forwardedIps.trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
