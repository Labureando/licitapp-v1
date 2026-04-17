import {
  Injectable,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity, OrganizationEntity } from '../entities';
import { CreateUserDto } from '../dto';
import { Role, Plan } from '../enums';
import { EmailService } from '../../../infrastructure/email';
import { UserSanitizeHelper } from '../helpers';
import { UserAuthService } from './user-auth.service';

@Injectable()
export class UserCreateService {
  private readonly logger = new Logger(UserCreateService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationsRepository: Repository<OrganizationEntity>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly sanitizeHelper: UserSanitizeHelper,
    private readonly authService: UserAuthService,
  ) {}

  /**
   * Crear un nuevo usuario con transacción
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sanitizedEmail = this.sanitizeHelper.sanitizeEmail(createUserDto.email);

      const existingUser = await queryRunner.manager.findOne(UserEntity, {
        where: { email: sanitizedEmail },
      });

      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // Validación de planes y organización
      const organizationId = createUserDto.organizationId;
      let userPlan: Plan | undefined;

      if (createUserDto.organizationId) {
        userPlan = undefined;
      } else {
        userPlan = createUserDto.userPlan || Plan.FREE;
      }

      if (organizationId) {
        const organization = await queryRunner.manager.findOne(OrganizationEntity, {
          where: { id: organizationId },
        });

        if (!organization) {
          throw new BadRequestException('La organización no existe');
        }

        if (createUserDto.role !== Role.SUPER_ADMIN && createUserDto.role !== Role.ORG_OWNER) {
          const userCount = await queryRunner.manager.count(UserEntity, {
            where: { organizationId: organizationId },
          });
          // TODO: Integrar LimitsService para validar límites según plan
        }
      } else {
        if (createUserDto.role && createUserDto.role !== Role.PUBLIC_USER) {
          throw new BadRequestException(
            'Solo PUBLIC_USER puede no pertenecer a una organización. Para ORG_OWNER/ORG_MEMBER se requiere organizationId.',
          );
        }

        if (!userPlan || ![Plan.FREE, Plan.PRO, Plan.ADVANCED].includes(userPlan)) {
          throw new BadRequestException(
            `Plan no válido para usuario individual. Debe ser: ${Plan.FREE}, ${Plan.PRO}, o ${Plan.ADVANCED}`,
          );
        }
      }

      // Hashear contraseña
      const hashedPassword = await this.authService.hashPassword(createUserDto.password);

      // Crear usuario
      const user = queryRunner.manager.create(UserEntity, {
        email: sanitizedEmail,
        firstName: this.sanitizeHelper.sanitizeName(createUserDto.firstName),
        lastName: this.sanitizeHelper.sanitizeName(createUserDto.lastName),
        phone: createUserDto.phone,
        timezone: createUserDto.timezone,
        password: hashedPassword,
        role: createUserDto.role || Role.PUBLIC_USER,
        userPlan: userPlan,
        organizationId: organizationId || undefined,
        isActive: true,
      });

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      this.logger.log(`Usuario creado: ${savedUser.email}`);

      // Enviar correo de bienvenida (fuera de la transacción)
      try {
        await this.emailService.sendWelcomeEmail(
          savedUser.email,
          savedUser.firstName,
        );
      } catch (error) {
        this.logger.warn(
          `Error al enviar correo de bienvenida a ${savedUser.email}: ${(error as Error).message}`,
        );
      }

      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al crear usuario: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
