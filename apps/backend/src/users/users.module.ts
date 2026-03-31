import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Organization } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class UsersModule {}