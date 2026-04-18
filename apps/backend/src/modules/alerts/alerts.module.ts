import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertEntity } from './entities/alert.entity';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../infrastructure/email/email.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity]),
    UsersModule,
    EmailModule,
    SearchModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
