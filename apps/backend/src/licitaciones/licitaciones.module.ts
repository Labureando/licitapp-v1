import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Licitacion, OrganoContratacion, SavedLicitacion } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Licitacion, OrganoContratacion, SavedLicitacion])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class LicitacionesModule {}