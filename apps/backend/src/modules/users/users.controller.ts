/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, RequestPasswordChangeDto, ConfirmPasswordChangeDto, ChangePasswordDto } from './dto';
import { UserEntity } from './entities';
import { Role } from './enums';
import { OrganizationEntity } from './entities/organization.entity';
import {
  SecureAuthEndpoint,
  SecureOwnershipEndpoint,
  LogAuditAction,
  SecureDeleteEndpoint,
  RequireRoles,
  ValidateResourceExists,
} from '../../common/decorators';

@ApiTags('👥 Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Obtener todos los usuarios (admin only)
   */
  @Get()
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Listar todos los usuarios',
    description: 'Obtiene una lista de todos los usuarios del sistema. Solo disponible para administradores.',
  })
  @ApiOkResponse({
    description: 'Lista de usuarios obtenida exitosamente',
    isArray: true,
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          firstName: 'Juan',
          lastName: 'García',
          role: 'ADMIN',
          isActive: true,
          createdAt: '2026-04-17T03:00:00Z',
        },
      ],
    },
  })
  @ApiForbiddenResponse({ description: 'Solo administradores pueden acceder' })
  @ApiUnauthorizedResponse({ description: 'No autorizado o token inválido' })
  async findAll(): Promise<Partial<UserEntity>[]> {
    return this.usersService.findAll();
  }

  /**
   * Listar usuarios de una organización específica
   */
  @Get('organization/:organizationId')
  @SecureAuthEndpoint()
  @ValidateResourceExists(OrganizationEntity, 'organizationId')
  @ApiOperation({
    summary: 'Listar usuarios por organización',
    description: 'Obtiene todos los usuarios asociados a una organización específica.',
  })
  @ApiParam({
    name: 'organizationId',
    type: 'string',
    format: 'uuid',
    description: 'ID único de la organización (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Usuarios de la organización obtenidos exitosamente',
    isArray: true,
  })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
  async listByOrganization(
    @Param('organizationId') organizationId: string,
  ): Promise<Partial<UserEntity>[]> {
    return this.usersService.listByOrganization(organizationId);
  }

  /**
   * Obtener información de un usuario específico
   */
  @Get(':userId')
  @SecureAuthEndpoint()
  @ValidateResourceExists(UserEntity, 'userId')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Recupera la información detallada de un usuario específico usando su ID único.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Usuario obtenido exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async findOne(@Param('userId') userId: string): Promise<Partial<UserEntity> | null> {
    return this.usersService.findOne(userId);
  }

  /**
   * Actualizar información de un usuario
   */
  @Patch(':userId')
  @SecureAuthEndpoint()
  @SecureOwnershipEndpoint('userId')
  @LogAuditAction('USER_UPDATE')
  @ApiOperation({
    summary: 'Actualizar datos del usuario',
    description: 'Actualiza la información del usuario como nombre, teléfono, zona horaria, etc.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: 'ID del usuario a actualizar',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Datos a actualizar del usuario',
    examples: {
      partial: {
        value: {
          firstName: 'Juan',
          lastName: 'García',
          phone: '+34 612 345 678',
          timezone: 'Europe/Madrid',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Usuario actualizado exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({ description: 'Email duplicado o datos inválidos' })
  async update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserEntity>> {
    return this.usersService.updateUser(userId, undefined, updateUserDto);
  }

  /**
   * Desactivar un usuario
   */
  @Post(':userId/deactivate')
  @SecureAuthEndpoint()
  @SecureOwnershipEndpoint('userId')
  @LogAuditAction('USER_DEACTIVATE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desactivar usuario',
    description: 'Desactiva una cuenta de usuario. La cuenta puede ser reactivada luego. El usuario no podrá acceder al sistema.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario a desactivar',
  })
  @ApiResponse({ status: 204, description: 'Usuario desactivado exitosamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async deactivate(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<void> {
    return this.usersService.deactivate(userId, organizationId);
  }

  /**
   * Reactivar un usuario
   */
  @Post(':userId/activate')
  @SecureAuthEndpoint()
  @SecureOwnershipEndpoint('userId')
  @LogAuditAction('USER_ACTIVATE')
  @ApiOperation({
    summary: 'Reactivar usuario',
    description: 'Reactiva una cuenta de usuario desactivada. El usuario vuelve a tener acceso al sistema.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario a reactivar',
  })
  @ApiOkResponse({
    description: 'Usuario reactivado exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async activate(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<Partial<UserEntity>> {
    return this.usersService.activate(userId, organizationId);
  }

  /**
   * Eliminar un usuario
   */
  @Delete(':userId')
  @SecureAuthEndpoint()
  @SecureOwnershipEndpoint('userId')
  @LogAuditAction('USER_DELETE')
  @SecureDeleteEndpoint(UserEntity, 'userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Elimina permanentemente una cuenta de usuario de la base de datos. Esta acción es irreversible.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID del usuario a eliminar',
  })
  @ApiResponse({ status: 204, description: 'Usuario eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async remove(@Param('userId') userId: string): Promise<void> {
    return this.usersService.deleteUser(userId);
  }

  // ============ PASSWORD ENDPOINTS ============

  /**
   * Solicitar cambio de contraseña
   */
  @Post('password/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar cambio de contraseña',
    description: 'Inicia el proceso de cambio de contraseña enviando un email con un link de verificación válido por 1 hora.',
  })
  @ApiBody({
    type: RequestPasswordChangeDto,
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Email enviado exitosamente',
    schema: {
      example: { message: 'Se ha enviado un correo para cambiar tu contraseña' },
    },
  })
  @ApiNotFoundResponse({ description: 'Usuario con este email no encontrado' })
  async requestPasswordChange(
    @Body() requestPasswordChangeDto: RequestPasswordChangeDto,
  ): Promise<{ message: string }> {
    return this.usersService.requestPasswordChange(requestPasswordChangeDto.email);
  }

  /**
   * Confirmar cambio de contraseña con token
   */
  @Post('password/confirm/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar cambio de contraseña',
    description: 'Completa el cambio de contraseña usando el token enviado por email. El token expira en 1 hora.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token de recuperación enviado por email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiBody({
    type: ConfirmPasswordChangeDto,
    examples: {
      example1: {
        value: {
          newPassword: 'NewSecurePassword123!',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Contraseña cambiada exitosamente',
    schema: {
      example: { message: 'Tu contraseña ha sido actualizada correctamente' },
    },
  })
  @ApiNotFoundResponse({ description: 'Token inválido o expirado' })
  @ApiConflictResponse({ description: 'Token ya ha sido utilizado' })
  async confirmPasswordChange(
    @Param('token') token: string,
    @Body() confirmPasswordChangeDto: ConfirmPasswordChangeDto,
  ): Promise<{ message: string }> {
    return this.usersService.confirmPasswordChange(
      token,
      confirmPasswordChangeDto.newPassword,
    );
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  @Patch('password/change')
  @SecureAuthEndpoint()
  @LogAuditAction('PASSWORD_CHANGE')
  @ApiOperation({
    summary: 'Cambiar contraseña directa',
    description: 'Permite a un usuario autenticado cambiar su contraseña directamente. Requiere la contraseña anterior como validación de seguridad.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      example1: {
        value: {
          oldPassword: 'CurrentPassword123!',
          newPassword: 'NewSecurePassword456!',
          newPasswordConfirm: 'NewSecurePassword456!',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Contraseña cambiada exitosamente',
    schema: {
      example: { message: 'Tu contraseña ha sido actualizada' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Contraseña anterior incorrecta' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(
      req.user.sub,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
      changePasswordDto.newPasswordConfirm,
    );
  }
}

