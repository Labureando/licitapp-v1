import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio de Protección contra Brute Force
 * Utiliza Redis para controlar intentos fallidos por IP
 *
 * Configuración:
 * - MAX_ATTEMPTS: 5 intentos
 * - WINDOW_TIME: 15 minutos (900 segundos)
 * - LOCKOUT_TIME: 30 minutos (1800 segundos)
 */
@Injectable()
export class BruteForceService {
  private readonly logger = new Logger(BruteForceService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_TIME = 15 * 60; // 15 minutos en segundos
  private readonly LOCKOUT_TIME = 30 * 60; // 30 minutos en segundos
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
        this.logger.log('✅ Redis conectado para Brute Force Protection');
        this.isConnected = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      this.logger.error('Error conectando a Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Registrar intento fallido
   * @param identifier - IP o usuario identificador
   * @returns true si el IP está bloqueado
   */
  async recordFailedAttempt(identifier: string): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis no disponible, Brute Force Protection deshabilitado');
      return false;
    }

    try {
      const lockoutKey = `brute_force:lockout:${identifier}`;
      const attemptsKey = `brute_force:attempts:${identifier}`;

      // Verificar si IP está bloqueado
      const isLocked = await this.redisClient.exists(lockoutKey);
      if (isLocked) {
        const timeLeft = await this.redisClient.ttl(lockoutKey);
        this.logger.warn(`❌ IP ${identifier} bloqueada. Desbloqueo en ${timeLeft}s`);
        return true;
      }

      // Incrementar contador de intentos
      const attempts = await this.redisClient.incr(attemptsKey);

      if (attempts === 1) {
        // Primer intento, establecer TTL
        await this.redisClient.expire(attemptsKey, this.WINDOW_TIME);
      }

      this.logger.debug(`⚠️ IP ${identifier}: ${attempts}/${this.MAX_ATTEMPTS} intentos`);

      // Si supera máximo de intentos, bloquear IP
      if (attempts > this.MAX_ATTEMPTS) {
        await this.redisClient.setEx(lockoutKey, this.LOCKOUT_TIME, 'true');
        this.logger.warn(`🚨 IP ${identifier} bloqueada por ${this.LOCKOUT_TIME}s`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error en recordFailedAttempt:', error);
      // Si Redis falla, permitir acceso (graceful degradation)
      return false;
    }
  }

  /**
   * Verificar si IP está bloqueado
   * @param identifier - IP o usuario identificador
   * @returns true si está bloqueado
   */
  async isBlocked(identifier: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const lockoutKey = `brute_force:lockout:${identifier}`;
      const isLocked = await this.redisClient.exists(lockoutKey);
      return isLocked === 1;
    } catch (error) {
      this.logger.error('Error en isBlocked:', error);
      return false;
    }
  }

  /**
   * Obtener intentos restantes para IP
   * @param identifier - IP o usuario identificador
   * @returns número de intentos fallidos
   */
  async getAttempts(identifier: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const attemptsKey = `brute_force:attempts:${identifier}`;
      const attempts = await this.redisClient.get(attemptsKey);
      return attempts ? parseInt(attempts) : 0;
    } catch (error) {
      this.logger.error('Error en getAttempts:', error);
      return 0;
    }
  }

  /**
   * Limpiar intentos de un IP (login exitoso)
   * @param identifier - IP o usuario identificador
   */
  async resetAttempts(identifier: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const attemptsKey = `brute_force:attempts:${identifier}`;
      await this.redisClient.del(attemptsKey);
      this.logger.debug(`✅ Intentos reseteados para ${identifier}`);
    } catch (error) {
      this.logger.error('Error en resetAttempts:', error);
    }
  }

  /**
   * Desbloquear un IP manualmente (admin)
   * @param identifier - IP o usuario identificador
   */
  async unblock(identifier: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const lockoutKey = `brute_force:lockout:${identifier}`;
      const attemptsKey = `brute_force:attempts:${identifier}`;
      await this.redisClient.del([lockoutKey, attemptsKey]);
      this.logger.log(`🔓 IP ${identifier} desbloqueada manualmente`);
    } catch (error) {
      this.logger.error('Error en unblock:', error);
    }
  }

  /**
   * Cerrar conexión Redis (para graceful shutdown)
   */
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis desconectado');
    }
  }
}
