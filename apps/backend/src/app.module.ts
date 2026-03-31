import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { User, Organization, Licitacion, OrganoContratacion, Alerta, AlertMatch, SavedLicitacion, CpvCode, ScrapingLog } from './entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LicitacionesModule } from './licitaciones/licitaciones.module';
import { AlertasModule } from './alertas/alertas.module';
import { ScrapingModule } from './scraping/scraping.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardConfigModule } from './scraping/bull-board.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'licitaapp',
      entities: [User, Organization, Licitacion, OrganoContratacion, Alerta, AlertMatch, SavedLicitacion, CpvCode, ScrapingLog],
      synchronize: true,
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    }),

    AuthModule,
    UsersModule,
    LicitacionesModule,
    AlertasModule,
    BullBoardConfigModule,
    ScrapingModule,
    NotificationsModule,
    
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}