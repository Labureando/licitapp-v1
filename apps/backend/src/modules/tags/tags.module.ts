import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TagEntity, UserTagSubscriptionEntity } from './entities';

/**
 * Módulo de Etiquetas
 * Gestiona etiquetas globales (marketplace) y privadas (personalizadas)
 * 
 * Características:
 * - CRUD de etiquetas globales (admin)
 * - Creación de etiquetas privadas (usuario)
 * - Búsqueda con autocomplete
 * - Subscripciones y fijado en dashboard
 * - Promoción de privadas a globales
 */
@Module({
  imports: [TypeOrmModule.forFeature([TagEntity, UserTagSubscriptionEntity])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
