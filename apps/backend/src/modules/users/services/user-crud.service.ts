import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';
import { UpdateUserDto } from '../dto';
import { UserSanitizeHelper, UserQueryHelper } from '../helpers';

@Injectable()
export class UserCrudService {
  private readonly logger = new Logger(UserCrudService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly sanitizeHelper: UserSanitizeHelper,
    private readonly queryHelper: UserQueryHelper,
  ) {}

  /**
   * Listar usuarios de una organización
   */
  async listByOrganization(organizationId: string): Promise<Partial<UserEntity>[]> {
    return this.queryHelper
      .applyUserSelect(
        this.queryHelper
          .buildUserQuery(this.usersRepository)
          .where('user.organizationId = :organizationId', { organizationId }),
        this.queryHelper.getListFields(),
      )
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Buscar usuario por ID (sin contraseña)
   */
  async findOne(
    userId: string,
    organizationId?: string,
  ): Promise<Partial<UserEntity>> {
    let query = this.queryHelper
      .buildUserQuery(this.usersRepository)
      .where('user.id = :userId', { userId });

    if (organizationId) {
      query = query.andWhere('user.organizationId = :organizationId', {
        organizationId,
      });
    }

    const user = await this.queryHelper
      .applyUserSelect(query, this.queryHelper.getSafeFields())
      .getOne();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Obtener todos los usuarios
   */
  async findAll(): Promise<Partial<UserEntity>[]> {
    return this.queryHelper
      .applyUserSelect(
        this.queryHelper
          .buildUserQuery(this.usersRepository)
          .leftJoinAndSelect('user.organization', 'organization'),
        this.queryHelper.getListFields(),
      )
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Obtener usuarios de una organización (alias para listByOrganization)
   */
  async findByOrganization(organizationId: string): Promise<Partial<UserEntity>[]> {
    return this.listByOrganization(organizationId);
  }

  /**
   * Actualizar usuario
   */
  async updateUser(
    userId: string,
    organizationId: string | undefined,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserEntity>> {
    try {
      let query = this.queryHelper
        .buildUserQuery(this.usersRepository)
        .where('user.id = :userId', { userId });

      if (organizationId) {
        query = query.andWhere('user.organizationId = :organizationId', {
          organizationId,
        });
      }

      const user = await query.getOne();

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar si el correo ya está registrado por otro usuario
      if (updateUserDto.email) {
        const sanitizedNewEmail = this.sanitizeHelper.sanitizeEmail(updateUserDto.email);
        if (sanitizedNewEmail !== user.email) {
          const existingUser = await this.queryHelper
            .buildUserQuery(this.usersRepository)
            .where('user.email = :email', { email: sanitizedNewEmail })
            .getOne();

          if (existingUser) {
            throw new BadRequestException('El correo electrónico ya está registrado');
          }
        }

        user.email = sanitizedNewEmail;
      }

      // Actualizar campos
      if (updateUserDto.firstName) {
        user.firstName = this.sanitizeHelper.sanitizeName(updateUserDto.firstName);
      }
      if (updateUserDto.lastName) {
        user.lastName = this.sanitizeHelper.sanitizeName(updateUserDto.lastName);
      }
      if (updateUserDto.role) {
        user.role = updateUserDto.role;
      }
      if (updateUserDto.isActive !== undefined) {
        user.isActive = updateUserDto.isActive;
      }

      await this.usersRepository.save(user);
      this.logger.log(`Usuario actualizado: ${user.email}`);

      return await this.findOne(userId, organizationId);
    } catch (error) {
      this.logger.error(
        `Error al actualizar usuario: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Desactivar usuario
   */
  async deactivate(userId: string, organizationId: string): Promise<void> {
    const user = await this.queryHelper
      .buildUserQuery(this.usersRepository)
      .where('user.id = :userId AND user.organizationId = :organizationId', {
        userId,
        organizationId,
      })
      .getOne();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = false;
    await this.usersRepository.save(user);
    this.logger.log(`Usuario ${user.email} desactivado`);
  }

  /**
   * Reactivar usuario
   */
  async activate(
    userId: string,
    organizationId: string,
  ): Promise<Partial<UserEntity>> {
    const user = await this.queryHelper
      .buildUserQuery(this.usersRepository)
      .where('user.id = :userId AND user.organizationId = :organizationId', {
        userId,
        organizationId,
      })
      .getOne();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = true;
    await this.usersRepository.save(user);
    this.logger.log(`Usuario ${user.email} reactivado`);

    return await this.findOne(userId, organizationId);
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.queryHelper
        .buildUserQuery(this.usersRepository)
        .where('user.id = :id', { id })
        .getOne();

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      await this.usersRepository.remove(user);
      this.logger.log(`Usuario eliminado: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error al eliminar usuario: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
