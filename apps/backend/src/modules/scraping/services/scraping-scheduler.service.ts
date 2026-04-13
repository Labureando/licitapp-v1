import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlaceScraperService } from '../place/place-scraper.service';

@Injectable()
export class ScrapingScheduler implements OnModuleInit {
  private readonly logger = new Logger(ScrapingScheduler.name);
  private isRunning = false;

  constructor(private readonly placeScraper: PlaceScraperService) {}

  onModuleInit() {
    this.logger.log('ScrapingScheduler INICIADO — cada 5 min');

    // Primera ejecución a los 10 segundos de arrancar
    setTimeout(() => {
      void this.runScraping();
    }, 10000);

    // Después cada 5 minutos
    setInterval(
      () => {
        void this.runScraping();
      },
      5 * 60 * 1000
    );
  }

  private async runScraping(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('[Cron] Ya en ejecución, skip');
      return;
    }
    this.isRunning = true;
    this.logger.log('[Cron] Scraping PLACE...');
    try {
      const r = (await this.placeScraper.scrapeCurrentFeed(5)) as {
        newItems: number;
        updatedItems: number;
        errors: number;
      };
      this.logger.log(
        `[Cron] PLACE: ${r.newItems} new, ${r.updatedItems} updated`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`[Cron] Error: ${msg}`);
    } finally {
      this.isRunning = false;
    }
  }
}
