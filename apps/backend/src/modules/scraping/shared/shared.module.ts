import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Licitacion, OrganoContratacion, ScrapingLog } from './entities';
import { CodiceParser } from './parsers/codice.parser';

@Module({
  imports: [
    TypeOrmModule.forFeature([Licitacion, OrganoContratacion, ScrapingLog]),
  ],
  providers: [CodiceParser],
  exports: [TypeOrmModule, CodiceParser],
})
export class SharedModule {}
