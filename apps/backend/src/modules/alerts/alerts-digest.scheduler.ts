import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from './alerts.service';

/**
 * Scheduler que envía el digest diario de alertas a las 8:00 AM (hora servidor).
 */
@Injectable()
export class AlertsDigestScheduler {
  private readonly logger = new Logger(AlertsDigestScheduler.name);

  constructor(private readonly alertsService: AlertsService) {}

  @Cron('0 8 * * *', { name: 'alerts-daily-digest' })
  async runDigest(): Promise<void> {
    this.logger.log('[Digest] Ejecutando envío diario (8:00 AM)...');
    try {
      await this.alertsService.sendDailyDigestForAllAlerts();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[Digest] Error en envío diario: ${msg}`);
    }
  }
}
