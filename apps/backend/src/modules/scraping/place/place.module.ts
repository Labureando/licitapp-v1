import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlaceScraperService } from './place-scraper.service';
import { PlaceHistoricalService } from './place-historical.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [HttpModule.register({ timeout: 120000 }), SharedModule],
  providers: [PlaceScraperService, PlaceHistoricalService],
  exports: [PlaceScraperService, PlaceHistoricalService],
})
export class PlaceModule {}
