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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities';

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
}

