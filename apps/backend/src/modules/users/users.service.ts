import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Role } from './enums';
import {
  UserCrudService,
  UserAuthService,
  UserSignupService,
  UserPasswordService,
  UserOrganizationService,
  UserCreateService,
} from './services';

/**
 * Servicio de Usuarios (Orquestador)
 * Delega operaciones a servicios especializados
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly crudService: UserCrudService,
    private readonly authService: UserAuthService,
    private readonly signupService: UserSignupService,
    private readonly passwordService: UserPasswordService,
    private readonly organizationService: UserOrganizationService,
    private readonly createService: UserCreateService,
  ) {}

  // ============ CRUD OPERATIONS ============

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.createService.createUser(createUserDto);
  }

  async listByOrganization(organizationId: string): Promise<Partial<UserEntity>[]> {
    return this.crudService.listByOrganization(organizationId);
  }

  async findOne(userId: string, organizationId?: string): Promise<Partial<UserEntity>> {
    return this.crudService.findOne(userId, organizationId);
  }

  async findAll(): Promise<Partial<UserEntity>[]> {
    return this.crudService.findAll();
  }

  async findByOrganization(organizationId: string): Promise<Partial<UserEntity>[]> {
    return this.crudService.findByOrganization(organizationId);
  }

  async updateUser(
    userId: string,
    organizationId: string | undefined,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserEntity>> {
    return this.crudService.updateUser(userId, organizationId, updateUserDto);
  }

  async deactivate(userId: string, organizationId: string): Promise<void> {
    return this.crudService.deactivate(userId, organizationId);
  }

  async activate(userId: string, organizationId: string): Promise<Partial<UserEntity>> {
    return this.crudService.activate(userId, organizationId);
  }

  async deleteUser(id: string): Promise<void> {
    return this.crudService.deleteUser(id);
  }

  // ============ AUTHENTICATION OPERATIONS ============

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.authService.findByEmailWithPassword(email);
  }

  async findByGoogleId(google_id: string): Promise<UserEntity | null> {
    return this.authService.findByGoogleId(google_id);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.authService.findByEmail(email);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return this.authService.validatePassword(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return this.authService.hashPassword(password);
  }

  // ============ 2-STEP SIGNUP OPERATIONS ============

  async createIncompleteUser(signupData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    timezone?: string;
  }): Promise<UserEntity> {
    return this.signupService.createIncompleteUser(signupData);
  }

  async completeSignupWithPassword(
    token: string,
    password: string,
    passwordConfirm: string,
  ): Promise<UserEntity> {
    return this.signupService.completeSignupWithPassword(token, password, passwordConfirm);
  }

  // ============ PASSWORD OPERATIONS ============

  async requestPasswordChange(email: string): Promise<{ message: string }> {
    return this.passwordService.requestPasswordChange(email);
  }

  async confirmPasswordChange(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return this.passwordService.confirmPasswordChange(token, newPassword);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return this.passwordService.changePassword(userId, oldPassword, newPassword);
  }

  // ============ ORGANIZATION OPERATIONS ============

  async promoteToOrgOwner(userId: string, organizationId: string): Promise<UserEntity> {
    return this.organizationService.promoteToOrgOwner(userId, organizationId);
  }

  async createUserWithGoogle(googleUserData: {
    google_id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: Role;
    userPlan?: any;
  }): Promise<UserEntity> {
    return this.organizationService.createUserWithGoogle(googleUserData);
  }
}

