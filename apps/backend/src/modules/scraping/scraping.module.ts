import { Module } from '@nestjs/common';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { PlaceModule } from './place/place.module';
import { SharedModule } from './shared/shared.module';
import { ScrapingScheduler } from './services/scraping-scheduler.service';

@Module({
  imports: [PlaceModule, SharedModule],
  controllers: [ScrapingController],
  providers: [ScrapingService, ScrapingScheduler],
  exports: [PlaceModule, SharedModule],
})
export class ScrapingModule {}
