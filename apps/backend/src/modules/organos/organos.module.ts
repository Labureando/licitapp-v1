import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { OrganosController } from './organos.controller';
import { OrganosService } from './organos.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrganoContratacion])],
  controllers: [OrganosController],
  providers: [OrganosService],
  exports: [OrganosService],
})
export class OrganosModule {}