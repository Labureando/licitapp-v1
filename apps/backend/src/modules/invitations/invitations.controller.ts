import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { RoleGuard } from '../../common/guards';
import { RequireRoles, LogAuditAction, ValidateResourceExists } from '../../common/decorators';
import { Role } from '../users/enums';
import { InvitationEntity } from './entities/invitation.entity';
import { OrganizationEntity } from '../users/entities/organization.entity';

@ApiTags('📧 Invitations')
@ApiBearerAuth('access-token')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * Enviar invitación a un correo
   * Solo ORG_OWNER puede enviar invitaciones
   */
  @Post()
  @UseGuards(RoleGuard)
  @RequireRoles(Role.ORG_OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar invitación',
    description: 'Envía una invitación por correo a una persona para unirse a la organización. Solo el propietario de la organización (ORG_OWNER) puede enviar invitaciones.',
  })
  @ApiBody({
    type: CreateInvitationDto,
    description: 'Datos para la invitación',
    examples: {
      example1: {
        value: {
          email: 'newuser@example.com',
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Invitación enviada exitosamente',
    schema: {
      example: {
        id: 'inv-uuid',
        email: 'newuser@example.com',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        token: 'invitation-token-here',
        expiresAt: '2026-04-24T03:00:00Z',
        status: 'PENDING',
        message: 'Invitación enviada al correo',
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Solo ORG_OWNER puede enviar invitaciones' })
  @ApiConflictResponse({ description: 'El usuario ya es miembro de la organización' })
  async sendInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.invitationsService.sendInvitation(
      createInvitationDto,
      userId,
    );
  }

  /**
   * Aceptar una invitación
   * Acceso público - no requiere autenticación
   */
  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar invitación',
    description: 'Acepta una invitación mediante el token enviado por correo. Esta operación es pública y no requiere autenticación previa.',
  })
  @ApiParam({
    name: 'token',
    type: 'string',
    description: 'Token de invitación único (enviado por correo)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiOkResponse({
    description: 'Invitación aceptada exitosamente',
    schema: {
      example: {
        message: 'Invitación aceptada. Usuario agregado a la organización.',
        userId: 'new-user-uuid',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Invitación no encontrada' })
  @ApiConflictResponse({ description: 'Invitación expirada o ya utilizada' })
  async acceptInvitation(@Param('token') token: string) {
    return this.invitationsService.acceptInvitation(token);
  }

  /**
   * Obtener invitaciones pendientes de una organización
   * Solo ORG_OWNER puede ver esto
   */
  @Get('organization/:organizationId')
  @UseGuards(RoleGuard)
  @RequireRoles(Role.ORG_OWNER)
  @ValidateResourceExists(OrganizationEntity, 'organizationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar invitaciones de organización',
    description: 'Obtiene todas las invitaciones pendientes de una organización. Solo el ORG_OWNER puede ver las invitaciones de su organización.',
  })
  @ApiParam({
    name: 'organizationId',
    type: 'string',
    format: 'uuid',
    description: 'ID de la organización',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Invitaciones obtenidas exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 'inv-uuid-1',
            email: 'user1@example.com',
            status: 'PENDING',
            expiresAt: '2026-04-24T03:00:00Z',
          },
          {
            id: 'inv-uuid-2',
            email: 'user2@example.com',
            status: 'PENDING',
            expiresAt: '2026-04-24T03:00:00Z',
          },
        ],
        count: 2,
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Solo ORG_OWNER puede ver invitaciones' })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
  async getOrganizationInvitations(
    @Param('organizationId') organizationId: string,
  ) {
    return this.invitationsService.getOrganizationInvitations(organizationId);
  }

  /**
   * Cancelar una invitación pendiente
   * Solo ORG_OWNER puede cancelar
   */
  @Delete(':id')
  @UseGuards(RoleGuard)
  @RequireRoles(Role.ORG_OWNER)
  @LogAuditAction('INVITATION_CANCEL')
  @ValidateResourceExists(InvitationEntity, 'id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar invitación',
    description: 'Cancela una invitación pendiente. Solo el ORG_OWNER de la organización puede cancelar invitaciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID de la invitación a cancelar',
    example: 'inv-uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Invitación cancelada exitosamente',
  })
  @ApiForbiddenResponse({ description: 'Solo ORG_OWNER puede cancelar invitaciones' })
  @ApiNotFoundResponse({ description: 'Invitación no encontrada' })
  async cancelInvitation(@Param('id') id: string) {
    return this.invitationsService.cancelInvitation(id);
  }
}
