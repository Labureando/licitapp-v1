/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, RequestPasswordChangeDto, ConfirmPasswordChangeDto, ChangePasswordDto } from './dto';
import { UserEntity } from './entities';
import { RoleGuard } from '../../common/guards';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Crear un nuevo usuario
   * @param createUserDto - Datos del usuario a crear
   * @returns Usuario creado
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.createUser(createUserDto);
  }

  /**
   * Obtener todos los usuarios (solo admin)
   * @returns Lista de usuarios
   */
  @Get()
  async findAll(): Promise<Partial<UserEntity>[]> {
    return this.usersService.findAll();
  }

  /**
   * Listar usuarios de una organización
   * @param organizationId - ID de la organización
   * @returns Lista de usuarios de la organización
   */
  @Get('organization/:organizationId')
  async listByOrganization(
    @Param('organizationId') organizationId: string,
  ): Promise<Partial<UserEntity>[]> {
    return this.usersService.listByOrganization(organizationId);
  }

  /**
   * Obtener un usuario específico
   * @param userId - ID del usuario
   * @returns Datos del usuario
   */
  @Get(':userId')
  async findOne(@Param('userId') userId: string): Promise<Partial<UserEntity> | null> {
    return this.usersService.findOne(userId);
  }

  /**
   * Actualizar información de un usuario
   * @param userId - ID del usuario
   * @param updateUserDto - Datos a actualizar
   * @returns Usuario actualizado
   */
  @Patch(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserEntity>> {
    return this.usersService.updateUser(userId, undefined, updateUserDto);
  }

  /**
   * Desactivar un usuario
   * @param userId - ID del usuario
   * @param organizationId - ID de la organización
   * @returns Sin contenido (204)
   */
  @Post(':userId/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<void> {
    return this.usersService.deactivate(userId, organizationId);
  }

  /**
   * Reactivar un usuario
   * @param userId - ID del usuario
   * @param organizationId - ID de la organización
   * @returns Usuario reactivado
   */
  @Post(':userId/activate')
  async activate(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<Partial<UserEntity>> {
    return this.usersService.activate(userId, organizationId);
  }

  /**
   * Eliminar un usuario
   * @param userId - ID del usuario a eliminar
   * @returns Sin contenido (204)
   */
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('userId') userId: string): Promise<void> {
    return this.usersService.deleteUser(userId);
  }

  // ============ ENDPOINTS DE CAMBIO DE CONTRASEÑA ============

  /**
   * Solicitar cambio de contraseña por email
   * Envía un email con link tokenizado para cambiar contraseña
   * @param requestPasswordChangeDto - Email del usuario
   * @returns Mensaje de confirmación
   */
  @Post('password/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordChange(
    @Body() requestPasswordChangeDto: RequestPasswordChangeDto,
  ): Promise<{ message: string }> {
    return this.usersService.requestPasswordChange(requestPasswordChangeDto.email);
  }

  /**
   * Confirmar cambio de contraseña con token
   * Token debe haber sido enviado por email y no estar expirado
   * @param confirmPasswordChangeDto - Token y nueva contraseña
   * @returns Mensaje de confirmación
   */
  @Post('password/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordChange(
    @Body() confirmPasswordChangeDto: ConfirmPasswordChangeDto,
  ): Promise<{ message: string }> {
    return this.usersService.confirmPasswordChange(
      confirmPasswordChangeDto.token,
      confirmPasswordChangeDto.newPassword,
    );
  }

  /**
   * Cambiar contraseña directa (usuario logueado)
   * Requiere contraseña anterior válida
   * @param changePasswordDto - Contraseña anterior y nueva
   * @param req - Request con datos del usuario logueado
   * @returns Mensaje de confirmación
   */
  @Patch('password/change')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.usersService.changePassword(
      userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }
}

