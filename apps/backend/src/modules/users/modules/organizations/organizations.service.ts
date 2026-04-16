/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationEntity, UserEntity } from '../../entities';
import { CreateOrganizationDto } from './dto';
import { Plan } from '../../enums';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationsRepository: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  /**
   * Crear una nueva organización
   * Cuando un PUBLIC_USER crea una organización, se convierte automáticamente en ORG_OWNER
   * 
   * @param userId - ID del usuario creador (debe ser PUBLIC_USER)
   * @param createOrgDto - Datos de la organización
   * @param usersService - Servicio de usuarios para promover el usuario
   * @returns Organización creada
   */
  async createOrganization(
    userId: string,
    createOrgDto: CreateOrganizationDto,
    usersService: any, // Inyección circular evitada usando any
  ): Promise<OrganizationEntity> {
    try {
      // Validar que el usuario existe y es PUBLIC_USER
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (user.organizationId) {
        throw new BadRequestException(
          'El usuario ya pertenece a una organización. No puede crear otra.',
        );
      }

      // Crear la organización con plan STARTER por defecto (obligatorio pago)
      const organization = this.organizationsRepository.create({
        name: createOrgDto.name.trim(),
        description: createOrgDto.description?.trim(),
        website: createOrgDto.website?.trim(),
        logo: createOrgDto.logo?.trim(),
        phone: createOrgDto.phone?.trim(),
        cif: createOrgDto.cif?.trim().toUpperCase(),
        plan: Plan.STARTER, // Plan STARTER obligatorio para nuevas organizaciones (PAGO)
      });

      const savedOrganization = await this.organizationsRepository.save(organization);
      this.logger.log(
        `Organización creada: ${savedOrganization.id} - ${savedOrganization.name}`,
      );

      // Promover usuario a ORG_OWNER de esta organización
      await usersService.promoteToOrgOwner(userId, savedOrganization.id);
      this.logger.log(
        `Usuario ${userId} promovido a ORG_OWNER de ${savedOrganization.id}`,
      );

      return savedOrganization;
    } catch (error) {
      this.logger.error(
        `Error al crear organización: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Obtener organización por ID
   * @param organizationId - ID de la organización
   * @returns Datos de la organización
   */
  async findById(organizationId: string): Promise<OrganizationEntity> {
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId },
      relations: ['users'],
    });

    if (!organization) {
      throw new NotFoundException('Organización no encontrada');
    }

    return organization;
  }

  /**
   * Obtener todas las organizaciones
   * @returns Lista de organizaciones
   */
  async findAll(): Promise<OrganizationEntity[]> {
    return this.organizationsRepository.find({
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Actualizar organización
   * @param organizationId - ID de la organización
   * @param updateData - Datos a actualizar
   * @returns Organización actualizada
   */
  async updateOrganization(
    organizationId: string,
    updateData: Partial<OrganizationEntity>,
  ): Promise<OrganizationEntity> {
    try {
      const organization = await this.findById(organizationId);

      // Actualizar campos permitidos
      if (updateData.name) organization.name = updateData.name.trim();
      if (updateData.description !== undefined) organization.description = updateData.description?.trim();
      if (updateData.website !== undefined) organization.website = updateData.website?.trim();
      if (updateData.logo !== undefined) organization.logo = updateData.logo?.trim();
      if (updateData.phone !== undefined) organization.phone = updateData.phone?.trim();
      if (updateData.cif !== undefined) organization.cif = updateData.cif?.trim().toUpperCase();
      if (updateData.plan) organization.plan = updateData.plan;

      const updated = await this.organizationsRepository.save(organization);
      this.logger.log(`Organización actualizada: ${organizationId}`);

      return updated;
    } catch (error) {
      this.logger.error(
        `Error al actualizar organización: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Obtener cantidad de usuarios en una organización
   * @param organizationId - ID de la organización
   * @returns Número de usuarios
   */
  async getUserCount(organizationId: string): Promise<number> {
    return this.usersRepository.count({
      where: { organizationId },
    });
  }
}
