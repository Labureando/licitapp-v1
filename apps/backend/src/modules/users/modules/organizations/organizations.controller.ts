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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { OrganizationsService } from './organizations.service';
import { UsersService } from '../../users.service';
import { CreateOrganizationDto } from './dto';
import { RoleGuard, JwtAuthGuard, OwnershipGuard } from '../../../../common/guards';
import { RequireRoles, SuperAdminOnly, LogAuditAction, SecureOwnershipEndpoint, SecureAuthEndpoint, ValidateResourceExists, ValidateOwnership } from '../../../../common/decorators';
import { Role } from '../../enums';
import { OrganizationEntity, UserEntity } from '../../entities';

@ApiTags('🏢 Organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  /**
   * Crear una nueva organización
   * Automáticamente convierte al usuario PUBLIC_USER en ORG_OWNER
   */
  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRoles(Role.PUBLIC_USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva organización',
    description: 'Crea una nueva organización en el sistema. El usuario que la crea es automáticamente promovido a ORG_OWNER. Solo usuarios PUBLIC_USER pueden crear organizaciones.',
  })
  @ApiBody({
    type: CreateOrganizationDto,
    description: 'Datos para crear la organización',
    examples: {
      example1: {
        value: {
          name: 'Acme Corporation',
          description: 'Empresa de contratación pública',
          phone: '+34 912 345 678',
          website: 'https://acme.example.com',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Organización creada exitosamente',
    schema: {
      example: {
        statusCode: 201,
        message: 'Organización creada exitosamente. Usuario promovido a ORG_OWNER.',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Corporation',
          owner_id: 'user-uuid',
          createdAt: '2026-04-17T03:00:00Z',
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Solo usuarios PUBLIC_USER pueden crear organizaciones' })
  @ApiConflictResponse({ description: 'La organización ya existe' })
  async createOrganization(
    @Body() createOrgDto: CreateOrganizationDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    this.logger.log(`Usuario ${userId} creando nueva organización: ${createOrgDto.name}`);
    
    const organization = await this.organizationsService.createOrganization(
      userId,
      createOrgDto,
      this.usersService,
    );

    // Query directo al repositorio para obtener usuario actualizado con nuevo rol
    const updatedUser = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!updatedUser) {
      throw new Error('Usuario no encontrado después de la promoción');
    }

    // Regenerar JWT token con el nuevo rol ORG_OWNER
    const newPayload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    };

    const new_access_token = this.jwtService.sign(newPayload, {
      expiresIn: '3600s',
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Organización creada exitosamente. Usuario promovido a ORG_OWNER.',
      data: organization,
      access_token: new_access_token,
    };
  }

  /**
   * Obtener datos de una organización específica
   */
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ValidateResourceExists(OrganizationEntity, 'id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener organización por ID',
    description: 'Recupera la información completa de una organización específica usando su ID único.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único de la organización',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Organización obtenida exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Organización obtenida',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Corporation',
          description: 'Empresa de contratación pública',
          phone: '+34 912 345 678',
          website: 'https://acme.example.com',
          owner_id: 'user-uuid',
          createdAt: '2026-04-17T03:00:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
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
   * Obtener todas las organizaciones (SUPER_ADMIN solo)
   */
  @Get()
  @ApiBearerAuth('access-token')
  @RequireRoles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar todas las organizaciones',
    description: 'Obtiene una lista de todas las organizaciones del sistema. Solo disponible para SUPER_ADMIN.',
  })
  @ApiOkResponse({
    description: 'Lista de organizaciones obtenida',
    schema: {
      example: {
        statusCode: 200,
        message: 'Organizaciones obtenidas',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Acme Corporation',
            owner_id: 'user-uuid',
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            name: 'Beta Services',
            owner_id: 'user-uuid-2',
          },
        ],
        count: 2,
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Solo SUPER_ADMIN puede acceder' })
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
   * Actualizar datos de una organización
   * Solo ORG_OWNER o SUPER_ADMIN pueden actualizar
   */
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, OwnershipGuard, RoleGuard)
  @RequireRoles(Role.ORG_OWNER, Role.SUPER_ADMIN)
  @ValidateOwnership('id')
  @LogAuditAction('ORG_UPDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar organización',
    description: 'Actualiza la información de una organización. Solo el propietario (ORG_OWNER) o SUPER_ADMIN pueden actualizar.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la organización a actualizar',
  })
  @ApiBody({
    type: CreateOrganizationDto,
    description: 'Datos a actualizar',
    examples: {
      partial: {
        value: {
          name: 'Acme Corporation Updated',
          phone: '+34 912 345 679',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Organización actualizada exitosamente',
  })
  @ApiForbiddenResponse({ description: 'Solo ORG_OWNER o SUPER_ADMIN pueden actualizar' })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
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
   * Obtener cantidad de usuarios en una organización
   */
  @Get(':id/user-count')
  @ApiBearerAuth('access-token')
  @ValidateResourceExists(OrganizationEntity, 'id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Contar usuarios de organización',
    description: 'Obtiene el número total de usuarios asociados a una organización específica.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la organización',
  })
  @ApiOkResponse({
    description: 'Cantidad de usuarios obtenida',
    schema: {
      example: {
        statusCode: 200,
        message: 'Cantidad de usuarios obtenida',
        data: {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          userCount: 42,
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
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
