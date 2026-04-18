import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateGlobalTagDto, CreatePrivateTagDto, UpdateTagDto } from './dto';
import { TagEntity } from './entities';
import { Role } from '../users/enums';
import {
  CurrentUser,
  SecureOwnershipEndpoint,
  SecureAuthEndpoint,
  LogAuditAction,
  SecureDeleteEndpoint,
  RequireRoles,
} from '../../common/decorators';

/**
 * Controlador de Etiquetas
 * Endpoints para gestionar etiquetas híbridas (globales + privadas)
 */
@ApiTags('Tags - Etiquetas')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * CRUD GLOBALES (ADMIN)
   */

  /**
   * Crear etiqueta global (solo admin)
   */
  @Post('global')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @LogAuditAction('TAG_CREATE_GLOBAL')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear etiqueta global (Admin)',
    description: 'Crea una etiqueta global visible para todos los usuarios. Solo admin.',
  })
  @ApiCreatedResponse({
    description: 'Etiqueta global creada exitosamente',
    type: TagEntity,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o etiqueta duplicada',
  })
  async createGlobalTag(@Body() dto: CreateGlobalTagDto) {
    const tag = await this.tagsService.createGlobalTag(dto);
    return {
      success: true,
      message: 'Etiqueta global creada exitosamente',
      tag,
    };
  }

  /**
   * Obtener todas las etiquetas globales
   */
  @Get('global')
  @ApiOperation({
    summary: 'Obtener todas las etiquetas globales',
    description: 'Lista todas las etiquetas del marketplace disponibles para subscripción',
  })
  @ApiOkResponse({
    description: 'Lista de etiquetas globales',
    isArray: true,
    type: TagEntity,
  })
  async getAllGlobalTags() {
    const tags = await this.tagsService.getAllGlobalTags();
    return {
      success: true,
      total: tags.length,
      tags,
    };
  }

  /**
   * Obtener etiquetas por categoría
   */
  @Get('category/:category')
  @ApiOperation({
    summary: 'Obtener etiquetas por categoría',
    description: 'Filtra etiquetas globales por categoría (infraestructura, servicios, tecnología, etc.)',
  })
  @ApiParam({
    name: 'category',
    description: 'Categoría de etiquetas',
    example: 'infraestructura',
  })
  @ApiOkResponse({
    description: 'Etiquetas de la categoría',
    isArray: true,
    type: TagEntity,
  })
  async getTagsByCategory(@Param('category') category: string) {
    const tags = await this.tagsService.getTagsByCategory(category);
    return {
      success: true,
      total: tags.length,
      category,
      tags,
    };
  }

  /**
   * Buscar etiquetas (autocomplete)
   */
  @Get('search')
  @SecureAuthEndpoint()
  @ApiOperation({
    summary: 'Buscar etiquetas con autocomplete',
    description: 'Busca etiquetas por nombre, slug o keywords. Incluye info de subscripción del usuario.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Término de búsqueda',
    required: true,
    example: 'construcción',
  })
  @ApiOkResponse({
    description: 'Resultados de búsqueda con info de subscripción',
    isArray: true,
  })
  async searchTags(
    @Query('q') query: string,
    @CurrentUser() userId: string,
  ) {
    const results = await this.tagsService.searchTags(query, userId);
    return {
      success: true,
      query,
      total: results.length,
      results,
    };
  }

  /**
   * Obtener detalles de una etiqueta
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalles de una etiqueta',
    description: 'Obtiene información completa de una etiqueta específica',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la etiqueta',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Detalles de la etiqueta',
    type: TagEntity,
  })
  @ApiNotFoundResponse({
    description: 'Etiqueta no encontrada',
  })
  async getTagById(@Param('id') id: string) {
    const tag = await this.tagsService.getTagById(id);
    return {
      success: true,
      tag,
    };
  }

  /**
   * Actualizar etiqueta (solo propietario o admin)
   */
  @Patch(':id')
  @SecureOwnershipEndpoint('id')
  @ApiOperation({
    summary: 'Actualizar etiqueta',
    description: 'Edita campos de una etiqueta. Solo propietario o admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la etiqueta',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Etiqueta actualizada',
    type: TagEntity,
  })
  @ApiBadRequestResponse({
    description: 'Permisos insuficientes o datos inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Etiqueta no encontrada',
  })
  async updateTag(
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
    @CurrentUser() userId: string,
  ) {
    const tag = await this.tagsService.updateTag(id, dto, userId);
    return {
      success: true,
      message: 'Etiqueta actualizada exitosamente',
      tag,
    };
  }

  /**
   * Eliminar etiqueta
   */
  @Delete(':id')
  @SecureOwnershipEndpoint('id')
  @LogAuditAction('TAG_DELETE')
  @SecureDeleteEndpoint(TagEntity, 'id')
  @ApiOperation({
    summary: 'Eliminar etiqueta',
    description: 'Elimina una etiqueta. Admin pueden eliminar globales, usuarios sus privadas.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la etiqueta',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Etiqueta eliminada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Permisos insuficientes',
  })
  @ApiNotFoundResponse({
    description: 'Etiqueta no encontrada',
  })
  async deleteTag(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ) {
    await this.tagsService.deleteTag(id, userId);
    return {
      success: true,
      message: 'Etiqueta eliminada exitosamente',
    };
  }

  /**
   * ETIQUETAS PRIVADAS (USUARIO)
   */

  /**
   * Crear etiqueta privada
   */
  @Post('private')
  @HttpCode(HttpStatus.CREATED)
  @SecureAuthEndpoint()
  @ApiOperation({
    summary: 'Crear etiqueta privada (personalizada)',
    description: 'Crea una etiqueta solo visible para el usuario. Slug se auto-genera.',
  })
  @ApiCreatedResponse({
    description: 'Etiqueta privada creada',
    type: TagEntity,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  async createPrivateTag(
    @Body() dto: CreatePrivateTagDto,
    @CurrentUser() userId: string,
  ) {
    const tag = await this.tagsService.createPrivateTag(userId, dto);
    return {
      success: true,
      message: 'Etiqueta privada creada exitosamente',
      tag,
    };
  }

  /**
   * Obtener mis etiquetas (globales + privadas)
   */
  @Get('my/all')
  @SecureAuthEndpoint()
  @ApiOperation({
    summary: 'Obtener mis etiquetas (globales + privadas)',
    description: 'Lista todas las etiquetas del usuario: globales suscritas + privadas creadas',
  })
  @ApiOkResponse({
    description: 'Etiquetas del usuario con info de subscripción',
    isArray: true,
  })
  async getMyTags(@CurrentUser() userId: string) {
    const tags = await this.tagsService.getMyTags(userId);
    return {
      success: true,
      total: tags.length,
      tags,
    };
  }

  /**
   * Obtener etiquetas fijadas en dashboard
   */
  @Get('my/pinned')
  @SecureAuthEndpoint()
  @ApiOperation({
    summary: 'Obtener etiquetas fijadas en dashboard',
    description: 'Lista solo las etiquetas que el usuario ha fijado para acceso rápido',
  })
  @ApiOkResponse({
    description: 'Etiquetas fijadas',
    isArray: true,
  })
  async getPinnedTags(@CurrentUser() userId: string) {
    const tags = await this.tagsService.getPinnedTags(userId);
    return {
      success: true,
      total: tags.length,
      tags,
    };
  }

  /**
   * SUBSCRIPCIONES Y DASHBOARD
   */

  /**
   * Suscribirse a una etiqueta global
   */
  @Post(':id/subscribe')
  @SecureAuthEndpoint()
  @LogAuditAction('TAG_SUBSCRIBE')
  @ApiOperation({
    summary: 'Suscribirse a una etiqueta global',
    description: 'El usuario se suscribe a una etiqueta global para recibir notificaciones',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la etiqueta global',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Suscripción creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Solo etiquetas globales o ya suscrito',
  })
  @ApiNotFoundResponse({
    description: 'Etiqueta no encontrada',
  })
  async subscribeToTag(
    @Param('id') tagId: string,
    @CurrentUser() userId: string,
  ) {
    await this.tagsService.subscribeToTag(tagId, userId);
    return {
      success: true,
      message: 'Suscrito a la etiqueta exitosamente',
    };
  }

  /**
   * Desuscribirse de una etiqueta
   */
  @Delete(':id/unsubscribe')
  @SecureAuthEndpoint()
  @SecureOwnershipEndpoint('id')
  @LogAuditAction('TAG_UNSUBSCRIBE')
  @ApiOperation({
    summary: 'Desuscribirse de una etiqueta',
    description: 'El usuario cancela su suscripción a una etiqueta',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la etiqueta',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Desuscripción exitosa',
  })
  @ApiNotFoundResponse({
    description: 'No hay suscripción o etiqueta no encontrada',
  })
  async unsubscribeFromTag(
    @Param('id') tagId: string,
    @CurrentUser() userId: string,
  ) {
    await this.tagsService.unsubscribeFromTag(tagId, userId);
    return {
      success: true,
      message: 'Desuscrito de la etiqueta exitosamente',
    };
  }

  /**
   * Fijar/desfijar etiqueta en dashboard
   */
  @Patch(':id/pin')
  @SecureOwnershipEndpoint('id')
  @LogAuditAction('TAG_PIN')
  @ApiOperation({
    summary: 'Fijar o desfijar etiqueta en dashboard',
    description: 'Alterna el estado de fijación de una etiqueta para acceso rápido',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la etiqueta',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Estado de fijación actualizado',
  })
  @ApiNotFoundResponse({
    description: 'No hay suscripción o etiqueta no encontrada',
  })
  async togglePinTag(
    @Param('id') tagId: string,
    @CurrentUser() userId: string,
  ) {
    await this.tagsService.togglePinTag(tagId, userId);
    return {
      success: true,
      message: 'Estado de fijación actualizado',
    };
  }

  /**
   * PROMOCIÓN A GLOBAL
   */

  /**
   * Sumar voto para promover etiqueta a global
   */
  @Post(':id/vote-to-global')
  @SecureAuthEndpoint()
  @LogAuditAction('TAG_VOTE_GLOBAL')
  @ApiOperation({
    summary: 'Votar para promover etiqueta a global',
    description: 'Suma un voto a una etiqueta privada para promoverla a global',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la etiqueta privada',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Voto registrado exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Ya es global o no existe',
  })
  @ApiNotFoundResponse({
    description: 'Etiqueta no encontrada',
  })
  async voteTagToGlobal(@Param('id') tagId: string) {
    await this.tagsService.voteTagToGlobal(tagId);
    return {
      success: true,
      message: 'Voto registrado para promover esta etiqueta',
    };
  }

  /**
   * Obtener etiquetas candidatas a promover a global
   */
  @Get('candidates/global')
  @ApiOperation({
    summary: 'Obtener candidatas a promover a global',
    description: 'Lista etiquetas privadas con suficientes votos para considerarse globales',
  })
  @ApiQuery({
    name: 'minVotes',
    description: 'Mínimo de votos requeridos',
    required: false,
    example: 10,
  })
  @ApiOkResponse({
    description: 'Etiquetas candidatas',
    isArray: true,
    type: TagEntity,
  })
  async getCandidateTagsToGlobal(@Query('minVotes') minVotes?: number) {
    const tags = await this.tagsService.getCandidateTagsToGlobal(minVotes || 10);
    return {
      success: true,
      total: tags.length,
      tags,
    };
  }

  /**
   * Promover etiqueta a global (admin)
   */
  @Post(':id/promote-to-global')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @LogAuditAction('TAG_PROMOTE_GLOBAL')
  @ApiOperation({
    summary: 'Promover etiqueta a global (Admin)',
    description: 'Admin mueve una etiqueta privada al marketplace global',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la etiqueta privada',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Etiqueta promovida a global exitosamente',
    type: TagEntity,
  })
  @ApiBadRequestResponse({
    description: 'Ya es global o no existe',
  })
  @ApiNotFoundResponse({
    description: 'Etiqueta no encontrada',
  })
  async promoteTagToGlobal(@Param('id') tagId: string) {
    const tag = await this.tagsService.promoteTagToGlobal(tagId);
    return {
      success: true,
      message: 'Etiqueta promovida a global exitosamente',
      tag,
    };
  }
}
