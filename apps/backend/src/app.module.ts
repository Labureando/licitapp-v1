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

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormConfig),
    WinstonModule.forRoot(winstonConfig),
    AuthModule,
    UsersModule,
    HealthModule,
    ScrapingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
