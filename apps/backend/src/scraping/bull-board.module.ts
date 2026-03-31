import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({ name: 'scraping-fetch', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'scraping-parse', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'scraping-dedupe', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'scraping-enrich', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'alertas-match', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'alertas-notify', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'ia-process', adapter: BullMQAdapter }),
  ],
})
export class BullBoardConfigModule {}