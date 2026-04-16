import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity, OrganizationEntity } from './entities';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PlansModule } from './modules/plans/plans.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProfileModule } from './modules/profile/profile.module';
import { EmailModule } from '../../infrastructure/email';

/**
 * Módulo de Usuarios
 * Gestiona la creación, actualización y administración de usuarios del sistema
 *
 * Características:
 * - Autenticación y validación de usuarios
 * - Gestión de roles y permisos
 * - Planes y límites por organización
 * - Integración con email (bienvenida, reset contraseña)
 * - Transacciones en operaciones críticas (createUser)
 *
 * Sub-módulos:
 * - RolesModule: Gestión de roles (SUPER_ADMIN, ORG_OWNER, etc.)
 * - PermissionsModule: Lógica de permisos (canManageUsers, canUsePipelines)
 * - PlansModule: Gestión de planes (FREE, PRO, ADVANCED, ENTERPRISE)
 * - OrganizationsModule: Gestión de organizaciones
 * - ProfileModule: Datos de perfil del usuario
 */
@Module({
  imports: [
    // TypeORM repositories: UserEntity y OrganizationEntity
    // DataSource se inyecta automáticamente en UsersService
    TypeOrmModule.forFeature([UserEntity, OrganizationEntity]),
    // Módulos internos
    EmailModule,
    PermissionsModule,
    PlansModule,
    OrganizationsModule,
    ProfileModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  // Exportar UsersService para que otros módulos puedan inyectarlo
  exports: [UsersService],
})
export class UsersModule {}
