import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapingLog, Licitacion, OrganoContratacion } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScrapingLog, Licitacion, OrganoContratacion]),

    // Colas de trabajo
    BullModule.registerQueue({ name: 'scraping-fetch' }),
    BullModule.registerQueue({ name: 'scraping-parse' }),
    BullModule.registerQueue({ name: 'scraping-dedupe' }),
    BullModule.registerQueue({ name: 'scraping-enrich' }),
    BullModule.registerQueue({ name: 'alertas-match' }),
    BullModule.registerQueue({ name: 'alertas-notify' }),
    BullModule.registerQueue({ name: 'ia-process' }),
  ],
  exports: [BullModule, TypeOrmModule],
})
export class ScrapingModule {}