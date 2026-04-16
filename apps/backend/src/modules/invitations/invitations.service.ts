import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationEntity } from './entities/invitation.entity';
import { InvitationStatus } from './enums/invitation-status.enum';
import { OrganizationEntity } from '../users/entities/organization.entity';
import { UserEntity } from '../users/entities/user.entity';
import { EmailService } from '../../infrastructure/email/email.service';
import { Role } from '../users/enums';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Envía una invitación a un correo para unirse a la organización
   */
  async sendInvitation(
    createInvitationDto: CreateInvitationDto,
    invitedByUserId: string,
  ): Promise<InvitationEntity> {
    const { organizationId, email } = createInvitationDto;
    const sanitizedEmail = email.toLowerCase().trim();

    // 1. Validar que la organización existe
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('La organización no existe');
    }

    // 2. Validar que el email no pertenece a un usuario existente
    const existingUser = await this.userRepository.findOne({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        'El correo ya está registrado en el sistema. Si es miembro de esta organización, ya tiene acceso.',
      );
    }

    // 3. Validar que no hay invitación PENDING al mismo email en esta org
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        email: sanitizedEmail,
        organizationId,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'Ya existe una invitación pendiente para este correo en esta organización.',
      );
    }

    // 4. Generar token único
    const token = this.generateToken();

    // 5. Calcular expiración (24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 6. Crear invitación
    const invitation = this.invitationRepository.create({
      organizationId,
      invitedByUserId,
      email: sanitizedEmail,
      token,
      status: InvitationStatus.PENDING,
      expiresAt,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // 7. Enviar email
    await this.emailService.sendEmail({
      to: sanitizedEmail,
      subject: `Invitación a unirte a ${organization.name} en LicitApp`,
      html: this.generateInvitationEmailHtml(
        organization.name,
        token,
        expiresAt,
      ),
    });

    return savedInvitation;
  }

  /**
   * Acepta una invitación y crea el usuario como ORG_MEMBER
   */
  async acceptInvitation(token: string): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar invitación
      const invitation = await queryRunner.manager.findOne(InvitationEntity, {
        where: { token },
        relations: ['organization', 'invitedBy'],
      });

      if (!invitation) {
        throw new NotFoundException('Invitación no encontrada o inválida');
      }

      // 2. Validar que no esté expirada
      if (new Date() > invitation.expiresAt) {
        throw new BadRequestException('La invitación ha expirado');
      }

      // 3. Validar que está en estado PENDING
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException(
          'Esta invitación ya ha sido procesada',
        );
      }

      // 4. Validar que el email no esté registrado
      const existingUser = await queryRunner.manager.findOne(UserEntity, {
        where: { email: invitation.email },
      });

      if (existingUser) {
        throw new ConflictException(
          'Este correo ya está registrado en el sistema',
        );
      }

      // 5. Crear usuario ORG_MEMBER
      const newUser = queryRunner.manager.create(UserEntity, {
        email: invitation.email,
        role: Role.ORG_MEMBER,
        organizationId: invitation.organizationId,
        // userPlan es undefined para miembros de org
        userPlan: undefined,
        // Generar una contraseña temporal (será necesario reset)
        password: this.generateTemporaryPassword(),
        firstName: '', // Será actualizado después
        lastName: '',
        isActive: true,
      });

      const savedUser = await queryRunner.manager.save(UserEntity, newUser);

      // 6. Actualizar invitación a ACCEPTED
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.acceptedAt = new Date();
      await queryRunner.manager.save(InvitationEntity, invitation);

      await queryRunner.commitTransaction();

      // 7. Enviar email de bienvenida
      await this.emailService.sendEmail({
        to: invitation.email,
        subject: `Bienvenido a ${invitation.organization.name}`,
        html: this.generateWelcomeEmailHtml(
          invitation.organization.name,
        ),
      });

      return {
        message: `Bienvenido a ${invitation.organization.name}. Tu cuenta ha sido creada.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todas las invitaciones PENDING de una organización
   */
  async getOrganizationInvitations(organizationId: string): Promise<InvitationEntity[]> {
    return this.invitationRepository.find({
      where: {
        organizationId,
        status: InvitationStatus.PENDING,
      },
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancela una invitación PENDING
   */
  async cancelInvitation(id: string): Promise<{ message: string }> {
    const invitation = await this.invitationRepository.findOne({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden cancelar invitaciones en estado PENDING',
      );
    }

    // Eliminar token para invalidarlo
    await this.invitationRepository.delete(id);

    return { message: 'Invitación cancelada correctamente' };
  }

  /**
   * Genera un token criptográfico único
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Genera una contraseña temporal
   */
  private generateTemporaryPassword(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Genera el HTML del email de invitación
   */
  private generateInvitationEmailHtml(
    organizationName: string,
    token: string,
    expiresAt: Date,
  ): string {
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/${token}/accept`;

    return `
      <h2>Invitación a ${organizationName}</h2>
      <p>Has sido invitado a unirte a <strong>${organizationName}</strong> en LicitApp.</p>
      <p>
        <a href="${acceptUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Aceptar invitación
        </a>
      </p>
      <p>Este enlace expira el ${expiresAt.toLocaleString('es-ES')}</p>
      <p>Si no esperabas esta invitación, puedes ignorar este email.</p>
    `;
  }

  /**
   * Genera el HTML del email de bienvenida
   */
  private generateWelcomeEmailHtml(organizationName: string): string {
    return `
      <h2>¡Bienvenido a LicitApp!</h2>
      <p>Tu cuenta ha sido creada correctamente como miembro de <strong>${organizationName}</strong>.</p>
      <p>Ahora puedes acceder a LicitApp y comenzar a colaborar con tu equipo.</p>
      <p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Acceder a LicitApp
        </a>
      </p>
    `;
  }
}
