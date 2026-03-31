import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alerta, AlertMatch } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Alerta, AlertMatch])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class AlertasModule {}