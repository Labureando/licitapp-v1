import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PlaceScraperService } from '../place/place-scraper.service';

@Injectable()
export class ScrapingScheduler {
  private readonly logger = new Logger(ScrapingScheduler.name);
  private isRunning = false;

  constructor(private readonly placeScraper: PlaceScraperService) {}

  @Cron('*/5 * * * *', { name: 'scraping-place' })
  async runScraping(): Promise<void> {
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
        `[Cron] PLACE: ${r.newItems} new, ${r.updatedItems} updated`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`[Cron] Error: ${msg}`);
    } finally {
      this.isRunning = false;
    }
  }
}
