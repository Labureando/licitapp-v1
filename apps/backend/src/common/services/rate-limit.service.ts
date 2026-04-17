import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio de Rate Limiting
 * Controla la cantidad de requests por IP/usuario en ventanas de tiempo
 *
 * Características:
 * - Límites configurables por ruta
 * - Ventanas de tiempo flexible
 * - Diferentes límites por endpoint
 * - Graceful degradation si Redis falla
 * - Keys Redis: rate_limit:{endpoint}:{identifier}
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private redisClient: RedisClientType;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  /**
   * Inicializar cliente Redis
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.redisClient.on('error', (err) => {
        this.logger.debug('Redis client error:', err);
        this.isConnected = false;
      });

      this.redisClient.on('connect', () => {
        this.logger.log('✅ Redis conectado para Rate Limiting');
        this.isConnected = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      this.logger.error('Error conectando a Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Verificar si se puede hacer request (no ha excedido límite)
   * @param identifier - IP o usuario identificador
   * @param endpoint - Ruta del endpoint (ej: POST:/auth/login)
   * @param limit - Cantidad de requests permitidos
   * @param windowMs - Ventana de tiempo en ms
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  async isAllowed(
    identifier: string,
    endpoint: string,
    limit: number = 100,
    windowMs: number = 60 * 1000, // 1 minuto default
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    if (!this.isConnected) {
      this.logger.warn('Redis no disponible, Rate Limiting deshabilitado');
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + windowMs,
      };
    }

    try {
      const key = this.generateKey(endpoint, identifier);
      const windowSeconds = Math.ceil(windowMs / 1000);

      // Obtener count actual
      const count = await this.redisClient.get(key);
      const currentCount = count ? parseInt(count) : 0;

      // Obtener TTL
      let ttl = await this.redisClient.ttl(key);
      const isNewKey = ttl === -1 || ttl === -2;

      if (isNewKey) {
        // Primera request en esta ventana
        await this.redisClient.setEx(key, windowSeconds, '1');
        const resetTime = Date.now() + windowMs;

        this.logger.debug(`🟢 Rate Limit [${endpoint}] ${identifier}: 1/${limit} (window: ${windowSeconds}s)`);

        return {
          allowed: true,
          remaining: limit - 1,
          resetTime,
        };
      }

      // Key ya existe
      if (currentCount >= limit) {
        // Límite alcanzado
        const resetTime = Date.now() + ttl * 1000;
        this.logger.warn(
          `🔴 Rate Limit EXCEDIDO [${endpoint}] ${identifier}: ${currentCount}/${limit} (reset en ${ttl}s)`,
        );

        return {
          allowed: false,
          remaining: 0,
          resetTime,
        };
      }

      // Incrementar counter
      const newCount = await this.redisClient.incr(key);
      const resetTime = Date.now() + ttl * 1000;

      this.logger.debug(`🟡 Rate Limit [${endpoint}] ${identifier}: ${newCount}/${limit} (reset en ${ttl}s)`);

      return {
        allowed: true,
        remaining: limit - newCount,
        resetTime,
      };
    } catch (error) {
      this.logger.error('Error en isAllowed:', error);
      // Graceful degradation
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + windowMs,
      };
    }
  }

  /**
   * Resetear el contador para un endpoint/identificador
   * @param identifier - IP o usuario identificador
   * @param endpoint - Ruta del endpoint
   */
  async resetCounter(identifier: string, endpoint: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const key = this.generateKey(endpoint, identifier);
      await this.redisClient.del([key]);
      this.logger.debug(`✅ Rate limit reseteado para ${endpoint} - ${identifier}`);
    } catch (error) {
      this.logger.error('Error en resetCounter:', error);
    }
  }

  /**
   * Obtener info actual del rate limit
   * @param identifier - IP o usuario identificador
   * @param endpoint - Ruta del endpoint
   * @param limit - Límite total
   */
  async getInfo(
    identifier: string,
    endpoint: string,
    limit: number,
  ): Promise<{
    currentCount: number;
    limit: number;
    remaining: number;
    ttl: number;
  }> {
    if (!this.isConnected) {
      return {
        currentCount: 0,
        limit,
        remaining: limit,
        ttl: 0,
      };
    }

    try {
      const key = this.generateKey(endpoint, identifier);
      const count = await this.redisClient.get(key);
      const currentCount = count ? parseInt(count) : 0;
      let ttl = await this.redisClient.ttl(key);

      if (ttl === -1 || ttl === -2) {
        ttl = 0;
      }

      return {
        currentCount,
        limit,
        remaining: Math.max(0, limit - currentCount),
        ttl,
      };
    } catch (error) {
      this.logger.error('Error en getInfo:', error);
      return {
        currentCount: 0,
        limit,
        remaining: limit,
        ttl: 0,
      };
    }
  }

  /**
   * Generar clave Redis normalizada
   * @private
   */
  private generateKey(endpoint: string, identifier: string): string {
    // Normalizar endpoint: /auth/login → auth_login
    const normalizedEndpoint = endpoint
      .replace(/^\//, '') // quitar / inicial
      .replace(/\//g, '_') // reemplazar / con _
      .replace(/:/g, '_'); // reemplazar : con _

    return `rate_limit:${normalizedEndpoint}:${identifier}`;
  }

  /**
   * Cerrar conexión Redis
   */
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis desconectado');
    }
  }
}
