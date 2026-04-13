import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlaceScraperService } from './place-scraper.service';

@Injectable()
export class ScrapingScheduler implements OnModuleInit {
  private readonly logger = new Logger(ScrapingScheduler.name);
  private isRunning = false;

  constructor(private readonly placeScraper: PlaceScraperService) {}

  onModuleInit() {
    this.logger.log('ScrapingScheduler INICIADO — cada 5 min');

    // Primera ejecución a los 10 segundos de arrancar
    setTimeout(() => this.runScraping(), 10000);

    // Después cada 5 minutos
    setInterval(() => this.runScraping(), 5 * 60 * 1000);
  }

  private async runScraping() {
    if (this.isRunning) { this.logger.warn('[Cron] Ya en ejecución, skip'); return; }
    this.isRunning = true;
    this.logger.log('[Cron] Scraping PLACE...');
    try {
      const r = await this.placeScraper.scrapeCurrentFeed(5);
      this.logger.log(`[Cron] PLACE: ${r.newItems} new, ${r.updatedItems} updated`);
    } catch (e) { this.logger.error(`[Cron] Error: ${e.message}`); }
    finally { this.isRunning = false; }
  }
}