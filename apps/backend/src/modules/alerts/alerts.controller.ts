import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AlertEntity } from './entities/alert.entity';
import {
  CurrentUser,
  SecureAuthEndpoint,
  SecureOwnershipEndpoint,
  LogAuditAction,
  SecureDeleteEndpoint,
  ValidateResourceExists,
} from '../../common/decorators';

@ApiTags('Alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Crear una nueva alerta personalizada
   *
   * @param createAlertDto - Datos de la alerta a crear
   * @param userId - ID del usuario autenticado
   * @returns Alerta creada
   */
  @Post()
  @SecureAuthEndpoint()
  @LogAuditAction('ALERT_CREATE')
  @ApiOperation({
    summary: 'Crear nueva alerta',
    description:
      'Crea una nueva alerta personalizada para notificaciones por email sobre licitaciones',
  })
  @ApiOkResponse({
    description: 'Alerta creada exitosamente',
    type: AlertEntity,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  create(
    @Body() createAlertDto: CreateAlertDto,
    @CurrentUser() userId: string,
  ) {
    return this.alertsService.create(userId, createAlertDto);
  }

  /**
   * Obtener todas las alertas del usuario autenticado
   *
   * @param userId - ID del usuario autenticado
   * @returns Array de alertas del usuario
   */
  @Get()
  @SecureAuthEndpoint()
  @ApiOperation({
    summary: 'Listar alertas',
    description: 'Obtiene todas las alertas personalizadas del usuario autenticado',
  })
  @ApiOkResponse({
    description: 'Lista de alertas',
    type: [AlertEntity],
  })
  findAll(@CurrentUser() userId: string) {
    return this.alertsService.findAll(userId);
  }

  /**
   * Obtener una alerta específica por ID
   *
   * @param id - ID de la alerta (UUID)
   * @param userId - ID del usuario autenticado
   * @returns Alerta encontrada
   */
  @Get(':id')
  @SecureAuthEndpoint()
  @SecureOwnershipEndpoint('id')
  @ValidateResourceExists(AlertEntity, 'id')
  @ApiOperation({
    summary: 'Obtener alerta',
    description: 'Obtiene los detalles de una alerta específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la alerta',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOkResponse({
    description: 'Alerta encontrada',
    type: AlertEntity,
  })
  @ApiNotFoundResponse({
    description: 'Alerta no encontrada',
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ) {
    return this.alertsService.findOne(id, userId);
  }

  /**
   * Actualizar una alerta existente
   *
   * @param id - ID de la alerta (UUID)
   * @param updateAlertDto - Campos a actualizar
   * @param userId - ID del usuario autenticado
   * @returns Alerta actualizada
   */
  @Patch(':id')
  @SecureAuthEndpoint()
  @SecureOwnershipEndpoint('id')
  @LogAuditAction('ALERT_UPDATE')
  @ApiOperation({
    summary: 'Actualizar alerta',
    description: 'Actualiza los criterios y configuración de una alerta existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la alerta',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOkResponse({
    description: 'Alerta actualizada',
    type: AlertEntity,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @ApiNotFoundResponse({
    description: 'Alerta no encontrada',
  })
  update(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
    @CurrentUser() userId: string,
  ) {
    return this.alertsService.update(id, userId, updateAlertDto);
  }

  /**
   * Eliminar una alerta
   *
   * @param id - ID de la alerta (UUID)
   * @param userId - ID del usuario autenticado
   */
  @Delete(':id')
  @SecureAuthEndpoint()
  @SecureOwnershipEndpoint('id')
  @LogAuditAction('ALERT_DELETE')
  @SecureDeleteEndpoint(AlertEntity, 'id')
  @ApiOperation({
    summary: 'Eliminar alerta',
    description: 'Elimina una alerta personalizada',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la alerta',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiOkResponse({
    description: 'Alerta eliminada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Alerta no encontrada',
  })
  remove(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ) {
    return this.alertsService.remove(id, userId);
  }
}
