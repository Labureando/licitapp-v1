import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeormConfig } from './config/typeorm.config';
import { winstonConfig } from './config/winston-nest.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { LicitacionesModule } from './modules/licitaciones/licitaciones.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormConfig),
    WinstonModule.forRoot(winstonConfig),
    ScheduleModule.forRoot(),
    HttpModule.register({ timeout: 120000 }),
    AuthModule,
    UsersModule,
    HealthModule,
    ScrapingModule,
    LicitacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
