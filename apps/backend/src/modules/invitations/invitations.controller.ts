import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { RoleGuard } from '../../common/guards';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { Role } from '../users/enums';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * POST /invitations
   * Envía una invitación a un correo para unirse a la organización
   * Solo ORG_OWNER puede hacer esto
   */
  @Post()
  @UseGuards(RoleGuard)
  @RequireRoles(Role.ORG_OWNER)
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
   * POST /invitations/:token/accept
   * Acepta una invitación mediante token
   * Acceso público (no requiere autenticación)
   */
  @Post(':token/accept')
  async acceptInvitation(@Param('token') token: string) {
    return this.invitationsService.acceptInvitation(token);
  }

  /**
   * GET /organizations/:organizationId/invitations
   * Obtiene todas las invitaciones pendientes de una organización
   * Solo ORG_OWNER puede ver esto
   */
  @Get('organization/:organizationId')
  @UseGuards(RoleGuard)
  @RequireRoles(Role.ORG_OWNER)
  async getOrganizationInvitations(
    @Param('organizationId') organizationId: string,
  ) {
    return this.invitationsService.getOrganizationInvitations(organizationId);
  }

  /**
   * DELETE /invitations/:id
   * Cancela una invitación pendiente
   * Solo ORG_OWNER puede hacer esto
   */
  @Delete(':id')
  @UseGuards(RoleGuard)
  @RequireRoles(Role.ORG_OWNER)
  async cancelInvitation(@Param('id') id: string) {
    return this.invitationsService.cancelInvitation(id);
  }
}
