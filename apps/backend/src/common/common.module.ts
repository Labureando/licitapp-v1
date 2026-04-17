import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BruteForceService } from './services/brute-force.service';
import { RateLimitService } from './services/rate-limit.service';

/**
 * Módulo Común
 * Proporciona servicios compartidos: guards, decorators, services
 *
 * Servicios exportados:
 * - BruteForceService: Protección contra ataques de fuerza bruta
 * - RateLimitService: Control de tasa de requests
 */
@Module({
  imports: [ConfigModule],
  providers: [BruteForceService, RateLimitService],
  exports: [BruteForceService, RateLimitService],
})
export class CommonModule {}
