import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Licitacion } from './entities/licitacion.entity';
import { OrganoContratacion } from './entities/organo-contratacion.entity';
import { ScrapingLog } from './entities/scraping-log.entity';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { CodiceParser } from './parsers/codice.parser';
import { PlaceScraperService } from './services/place-scraper.service';
import { PlaceHistoricalService } from './services/place-historical.service';
import { ScrapingScheduler } from './services/scraping-scheduler.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 120000 }),
    TypeOrmModule.forFeature([Licitacion, OrganoContratacion, ScrapingLog]),
  ],
  controllers: [ScrapingController],
  providers: [
    ScrapingService,
    CodiceParser,
    PlaceScraperService,
    PlaceHistoricalService,
    ScrapingScheduler,
  ],
  exports: [PlaceScraperService, TypeOrmModule],
})
export class ScrapingModule {}