/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { UseGuards, SetMetadata } from '@nestjs/common';
import { RateLimitGuard, RATE_LIMIT_KEY } from '../guards/rate-limiting/rate-limit.guard';

/**
 * Decorador para aplicar Rate Limiting a un endpoint
 */
export function RateLimit(limit: number, windowMs: number): any {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor): any => {
    const safePropertyKey = propertyKey ?? '';
    const safeDescriptor = descriptor ?? ({} as PropertyDescriptor);
    
    SetMetadata(RATE_LIMIT_KEY, { limit, windowMs })(
      target,
      safePropertyKey as string | symbol,
      safeDescriptor,
    );
    UseGuards(RateLimitGuard)(target, safePropertyKey as string | symbol, safeDescriptor);
  };
}

/**
 * Límite estricto para login/signup (5 requests/15 minutos)
 */
export function RateLimitStrict() {
  return RateLimit(5, 15 * 60 * 1000);
}

/**
 * Límite moderado para búsquedas (50 requests/minuto)
 */
export function RateLimitModerate() {
  return RateLimit(50, 60 * 1000);
}

/**
 * Límite relajado para listados (200 requests/minuto)
 */
export function RateLimitRelaxed() {
  return RateLimit(200, 60 * 1000);
}

/**
 * Sin límite (solo para endpoints públicos no críticos)
 */
export function RateLimitNone() {
  return RateLimit(1000, 60 * 1000);
}
