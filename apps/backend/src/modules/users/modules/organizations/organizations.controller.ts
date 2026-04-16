/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UsersService } from '../../users.service';
import { CreateOrganizationDto } from './dto';
import { RoleGuard } from '../../../../common/guards';
import { RequireRoles, SuperAdminOnly } from '../../../../common/decorators';
import { Role } from '../../enums';

@Controller('organizations')
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * POST /organizations
   * Crear una nueva organización
   * Automáticamente convierte al usuario PUBLIC_USER en ORG_OWNER
   * 
   * @param createOrgDto - Datos de la organización
   * @param req - Request con usuario autenticado
   * @returns Organización creada
   */
  @Post()
  @UseGuards(RoleGuard)
  @RequireRoles(Role.PUBLIC_USER)
  @HttpCode(HttpStatus.CREATED)
  async createOrganization(
    @Body() createOrgDto: CreateOrganizationDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    this.logger.log(`Usuario ${userId} creando nueva organización: ${createOrgDto.name}`);
    
    const organization = await this.organizationsService.createOrganization(
      userId,
      createOrgDto,
      this.usersService,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Organización creada exitosamente. Usuario promovido a ORG_OWNER.',
      data: organization,
    };
  }

  /**
   * GET /organizations/:id
   * Obtener datos de una organización
   * 
   * @param id - ID de la organización
   * @returns Datos de la organización
   */
  @Get(':id')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getOrganization(@Param('id') id: string) {
    this.logger.log(`Obteniendo organización: ${id}`);
    
    const organization = await this.organizationsService.findById(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Organización obtenida',
      data: organization,
    };
  }

  /**
   * GET /organizations
   * Obtener todas las organizaciones (SUPER_ADMIN solo)
   * 
   * @returns Lista de organizaciones
   */
  @Get()
  @UseGuards(RoleGuard)
  @SuperAdminOnly()
  @HttpCode(HttpStatus.OK)
  async getAllOrganizations() {
    this.logger.log('Obteniendo todas las organizaciones');
    
    const organizations = await this.organizationsService.findAll();

    return {
      statusCode: HttpStatus.OK,
      message: 'Organizaciones obtenidas',
      data: organizations,
      count: organizations.length,
    };
  }

  /**
   * PATCH /organizations/:id
   * Actualizar datos de una organización
   * Solo ORG_OWNER puede actualizar
   * 
   * @param id - ID de la organización
   * @param updateData - Datos a actualizar
   * @param req - Request con usuario autenticado
   * @returns Organización actualizada
   */
  @Patch(':id')
  @UseGuards(RoleGuard)
  @RequireRoles(Role.ORG_OWNER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateOrganization(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateOrganizationDto>,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    
    this.logger.log(`Usuario ${userId} actualizando organización: ${id}`);
    
    const organization = await this.organizationsService.updateOrganization(
      id,
      updateData as any,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Organización actualizada',
      data: organization,
    };
  }

  /**
   * GET /organizations/:id/user-count
   * Obtener cantidad de usuarios en una organización
   * 
   * @param id - ID de la organización
   * @returns Número de usuarios
   */
  @Get(':id/user-count')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async getUserCount(@Param('id') id: string) {
    this.logger.log(`Obteniendo cantidad de usuarios de organización: ${id}`);
    
    const count = await this.organizationsService.getUserCount(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Cantidad de usuarios obtenida',
      data: { organizationId: id, userCount: count },
    };
  }
}
