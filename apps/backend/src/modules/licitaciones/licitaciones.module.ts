import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicitacionesController } from './licitaciones.controller';
import { LicitacionesService } from './licitaciones.service';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Licitacion, OrganoContratacion]),
  ],
  controllers: [LicitacionesController],
  providers: [LicitacionesService],
  exports: [LicitacionesService],
})
export class LicitacionesModule {}