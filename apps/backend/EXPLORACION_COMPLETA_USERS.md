# Exploración Completa del Módulo Users y Related Systems

**Fecha:** 16 de abril de 2026  
**Alcance:** Módulo users, auth, decorators, guards, entities, enums

---

## 1. ENUM ROLE - Ubicación y Definición

**Ubicación:** [src/modules/users/enums/index.ts](src/modules/users/enums/index.ts)

```typescript
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',      // Administrador del sistema
  ORG_OWNER = 'ORG_OWNER',          // Propietario de la organización
  ORG_ADMIN = 'ORG_ADMIN',          // Admin de la organización (gestiona usuarios)
  ORG_MEMBER = 'ORG_MEMBER',        // Miembro de la organización
  ORG_VIEWER = 'ORG_VIEWER',        // Solo lectura en la organización
  PUBLIC_USER = 'PUBLIC_USER',      // Usuario público sin organización
}

export enum Plan {
  FREE = 'FREE',                    // Trial / acceso básico (1 usuario, 1 alerta, 50 créditos IA/mes)
  PRO = 'PRO',                      // 3 usuarios, 3 alertas, 500 créditos IA/mes
  ADVANCED = 'ADVANCED',            // 4 usuarios, 4 alertas, 1000 créditos IA/mes, 2 pipelines
  ENTERPRISE = 'ENTERPRISE',        // Ilimitado, personalizado
}

export const OrganizationPlan = Plan;  // @deprecated
export const UserPlan = Plan;          // @deprecated
```

---

## 2. ESTRUCTURA COMPLETA DEL MÓDULO USERS

### 2.1 Estructura de Directorios

```
src/modules/users/
├── users.controller.ts              ← Endpoints principales
├── users.controller.spec.ts         ← Tests del controller
├── users.service.ts                 ← Lógica de negocio
├── users.service.spec.ts            ← Tests del servicio
├── users.module.ts                  ← Módulo principal
├── dto/
│   ├── index.ts
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── entities/
│   ├── index.ts
│   ├── user.entity.ts
│   ├── role.entity.ts
│   └── organization.entity.ts
├── enums/
│   └── index.ts                     ← Role y Plan enums
├── modules/
│   ├── roles/
│   │   ├── roles.service.ts
│   │   └── roles.module.ts
│   ├── profile/
│   │   ├── profile.service.ts
│   │   └── profile.module.ts
│   ├── plans/
│   │   ├── plans.service.ts
│   │   ├── plans.module.ts
│   │   └── limits/
│   │       ├── limits.service.ts
│   │       └── limits.module.ts
│   └── permissions/
│       ├── permissions.service.ts   ← Gestión completa de permisos
│       ├── permissions.interface.ts
│       └── permissions.module.ts
```

---

## 3. USERS.SERVICE.TS - Métodos Disponibles

**Ubicación:** [src/modules/users/users.service.ts](src/modules/users/users.service.ts)

### Métodos Principales

| Método | Descripción | Parámetros | Retorna |
|--------|-------------|-----------|---------|
| `createUser()` | Crear nuevo usuario con transacción | `CreateUserDto` | `UserEntity` |
| `findAll()` | Obtener todos los usuarios | - | `Partial<UserEntity>[]` |
| `findOne(userId, organizationId?)` | Obtener usuario por ID | `userId: string`, `organizationId?: string` | `Partial<UserEntity>` |
| `findByEmailWithPassword()` | Buscar usuario por correo (con contraseña para auth) | `email: string` | `UserEntity \| null` |
| `listByOrganization()` | Listar usuarios de una organización | `organizationId: string` | `Partial<UserEntity>[]` |
| `findByOrganization()` | Alias para `listByOrganization()` | `organizationId: string` | `Partial<UserEntity>[]` |
| `updateUser()` | Actualizar información de usuario | `userId`, `organizationId?`, `UpdateUserDto` | `Partial<UserEntity>` |
| `deactivate()` | Desactivar un usuario | `userId: string`, `organizationId: string` | `void` |
| `activate()` | Reactivar un usuario | `userId: string`, `organizationId: string` | `Partial<UserEntity>` |
| `deleteUser()` | Eliminar usuario definitivamente | `id: string` | `void` |
| `validatePassword()` | Verificar contraseña hasheada | `plainPassword`, `hashedPassword` | `boolean` |
| `hashPassword()` | Hashear contraseña | `password: string` | `string` |
| `promoteToOrgOwner()` | Promover PUBLIC_USER a ORG_OWNER | `userId`, `organizationId` | `UserEntity` |

### Campos Seguro (USER_SAFE_FIELDS)
```typescript
- user.id
- user.email
- user.firstName
- user.lastName
- user.role
- user.isActive
- user.createdAt
- user.updatedAt
// NO incluye: password
```

### Constantes del Servicio
```typescript
private readonly SALT_ROUNDS = 10;  // Para bcrypt
```

---

## 4. USERS.CONTROLLER.TS - Endpoints

**Ubicación:** [src/modules/users/users.controller.ts](src/modules/users/users.controller.ts)

| Método HTTP | Endpoint | Función | DTO |
|-----------|----------|---------|-----|
| `POST` | `/users` | Crear usuario | `CreateUserDto` |
| `GET` | `/users` | Obtener todos los usuarios | - |
| `GET` | `/users/:userId` | Obtener usuario específico | - |
| `GET` | `/users/organization/:organizationId` | Listar usuarios de organización | - |
| `PATCH` | `/users/:userId` | Actualizar usuario | `UpdateUserDto` |
| `POST` | `/users/:userId/deactivate` | Desactivar usuario (204 No Content) | - |
| `POST` | `/users/:userId/activate` | Reactivar usuario | - |

---

## 5. DTOs DEL USERS MODULE

### 5.1 CreateUserDto

**Ubicación:** [src/modules/users/dto/create-user.dto.ts](src/modules/users/dto/create-user.dto.ts)

```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.PUBLIC_USER;

  @IsEnum(Plan)
  @IsOptional()
  userPlan?: Plan = Plan.FREE;

  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
```

### 5.2 UpdateUserDto

**Ubicación:** [src/modules/users/dto/update-user.dto.ts](src/modules/users/dto/update-user.dto.ts)

```typescript
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(Plan)
  @IsOptional()
  userPlan?: Plan;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

---

## 6. ENTITIES - Definiciones de Datos

### 6.1 UserEntity

**Ubicación:** [src/modules/users/entities/user.entity.ts](src/modules/users/entities/user.entity.ts)

```typescript
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ type: 'varchar', select: false })  // No se selecciona por defecto
  password!: string;

  @Column({ type: 'enum', enum: Role, default: Role.PUBLIC_USER })
  role!: Role;

  @Column({ type: 'enum', enum: Plan, default: Plan.FREE, nullable: true })
  userPlan?: Plan;  // Plan personal (usado para PUBLIC_USER)

  @Column({ type: 'uuid', nullable: true })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (org) => org.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
```

### 6.2 RoleEntity

**Ubicación:** [src/modules/users/entities/role.entity.ts](src/modules/users/entities/role.entity.ts)

```typescript
@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Role, unique: true })
  name: Role;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

### 6.3 OrganizationEntity

**Ubicación:** [src/modules/users/entities/organization.entity.ts](src/modules/users/entities/organization.entity.ts)

```typescript
@Entity('organizations')
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: Plan, default: Plan.FREE })
  plan: Plan;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => UserEntity, (user) => user.organization)
  users: UserEntity[];
}
```

---

## 7. DECORATORS - Archivo src/common/decorators/

### 7.1 roles.decorator.ts

**Ubicación:** [src/common/decorators/roles.decorator.ts](src/common/decorators/roles.decorator.ts)

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../modules/users/enums';

// Decorador genérico para especificar roles requeridos
export const RequireRoles = (...roles: Role[]) =>
  SetMetadata('roles', roles);

// Solo SUPER_ADMIN
export const SuperAdminOnly = () =>
  SetMetadata('roles', [Role.SUPER_ADMIN]);

// Admins de organización (incluye: SUPER_ADMIN, ORG_OWNER, ORG_ADMIN)
export const RequireOrgAdmin = () =>
  SetMetadata('roles', [Role.SUPER_ADMIN, Role.ORG_OWNER, Role.ORG_ADMIN]);

// Marcar ruta que requiere autenticación básica
export const RequireAuth = () =>
  SetMetadata('requireAuth', true);
```

### 7.2 plans.decorator.ts

**Ubicación:** [src/common/decorators/plans.decorator.ts](src/common/decorators/plans.decorator.ts)

```typescript
import { SetMetadata } from '@nestjs/common';
import { Plan } from '../../modules/users/enums';

// Decorador genérico para especificar planes requeridos
export const RequirePlans = (...plans: Plan[]) =>
  SetMetadata('plans', plans);

// Plan PRO o superior (PRO, ADVANCED, ENTERPRISE)
export const RequirePaidPlan = () =>
  SetMetadata('plans', [Plan.PRO, Plan.ADVANCED, Plan.ENTERPRISE]);

// Solo ENTERPRISE
export const RequireEnterprise = () =>
  SetMetadata('plans', [Plan.ENTERPRISE]);
```

### 7.3 index.ts

**Ubicación:** [src/common/decorators/index.ts](src/common/decorators/index.ts)

```typescript
export { RequireRoles, SuperAdminOnly, RequireOrgAdmin, RequireAuth } from './roles.decorator';
export { RequirePlans, RequirePaidPlan, RequireEnterprise } from './plans.decorator';
```

---

## 8. GUARDS - Archivo src/common/guards/

### 8.1 role.guard.ts

**Ubicación:** [src/common/guards/role.guard.ts](src/common/guards/role.guard.ts)

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    
    if (!requiredRoles) return true;  // Sin restricción = permitir
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }
    
    if (!user.isActive) {
      throw new ForbiddenException('Usuario desactivado');
    }
    
    const hasRole = requiredRoles.includes(user.role);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Rol insuficiente. Roles requeridos: ${requiredRoles.join(', ')}`
      );
    }
    
    return true;
  }
}
```

**Uso:** 
```typescript
@Get('admin-only')
@RequireOrgAdmin()  // Requiere SUPER_ADMIN, ORG_OWNER o ORG_ADMIN
@UseGuards(RoleGuard)
async adminEndpoint() { }
```

### 8.2 plan.guard.ts

**Ubicación:** [src/common/guards/plan.guard.ts](src/common/guards/plan.guard.ts)

```typescript
@Injectable()
export class PlanGuard implements CanActivate {
  private readonly logger = new Logger(PlanGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(OrganizationEntity)
    private organizationsRepository: Repository<OrganizationEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.get<Plan[]>('plans', context.getHandler());
    
    if (!requiredPlans) return true;
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }
    
    if (user.role === 'SUPER_ADMIN') return true;  // SUPER_ADMIN siempre accede
    
    if (!user.organizationId) {
      throw new ForbiddenException('Usuario debe pertenecer a una organización');
    }
    
    const organization = await this.organizationsRepository.findOne({
      where: { id: user.organizationId },
    });
    
    if (!organization) {
      throw new ForbiddenException('Organización no encontrada');
    }
    
    const hasPlan = requiredPlans.includes(organization.plan);
    
    if (!hasPlan) {
      throw new ForbiddenException(
        `Plan insuficiente. Planes requeridos: ${requiredPlans.join(', ')}`
      );
    }
    
    return true;
  }
}
```

### 8.3 permissions.guard.ts

**Ubicación:** [src/common/guards/permissions.guard.ts](src/common/guards/permissions.guard.ts)

Validación genérica para permisos complejos (rol + plan):

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    @InjectRepository(OrganizationEntity)
    private organizationsRepository: Repository<OrganizationEntity>,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserEntity = request.user;
    
    if (!user) throw new ForbiddenException('Usuario no autenticado');
    if (!user.isActive) throw new ForbiddenException('Usuario desactivado');
    if (this.permissionsService.isSuperAdmin(user)) return true;
    if (!user.organizationId) throw new ForbiddenException('Sin organización');
    
    const organization = await this.organizationsRepository.findOne({
      where: { id: user.organizationId },
    });
    
    request.organization = organization;
    return true;
  }
}
```

### 8.4 index.ts

**Ubicación:** [src/common/guards/index.ts](src/common/guards/index.ts)

```typescript
export { RoleGuard } from './role.guard';
export { PlanGuard } from './plan.guard';
export { PermissionsGuard } from './permissions.guard';
```

---

## 9. AUTH MODULE

### 9.1 DTOs del Auth Module

**Ubicación:** [src/modules/auth/dto/](src/modules/auth/dto/)

#### create-auth.dto.ts
```typescript
export class CreateAuthDto {}  // Vacío - requiere implementación
```

#### update-auth.dto.ts
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
```

### 9.2 Auth Service

**Ubicación:** [src/modules/auth/auth.service.ts](src/modules/auth/auth.service.ts)

```typescript
@Injectable()
export class AuthService {
  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
```

**⚠️ Estado:** Actualmente es un template boilerplate. **Necesita implementación real.**

### 9.3 Auth Controller

**Ubicación:** [src/modules/auth/auth.controller.ts](src/modules/auth/auth.controller.ts)

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) { }

  @Get()
  findAll() { }

  @Get(':id')
  findOne(@Param('id') id: string) { }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) { }

  @Delete(':id')
  remove(@Param('id') id: string) { }
}
```

**⚠️ Estado:** Endpoints básicos sin lógica de autenticación real.

---

## 10. PERMISSIONS SERVICE - Gestión Centralizada de Permisos

**Ubicación:** [src/modules/users/modules/permissions/permissions.service.ts](src/modules/users/modules/permissions/permissions.service.ts)

### Métodos de Validación por Rol

| Método | Validación |
|--------|-----------|
| `canManageUsers()` | `[SUPER_ADMIN, ORG_OWNER, ORG_ADMIN]` |
| `canManageLicitaciones()` | `[SUPER_ADMIN, ORG_OWNER, ORG_ADMIN, ORG_MEMBER]` |
| `canViewAnalytics()` | `[SUPER_ADMIN, ORG_OWNER, ORG_ADMIN, ORG_VIEWER]` |
| `canManagePlan()` | `[SUPER_ADMIN, ORG_OWNER]` |
| `isSuperAdmin()` | Retorna `true` si `user.role === SUPER_ADMIN` |
| `isOrgOwner()` | Retorna `true` si `user.role === ORG_OWNER` |
| `isOrgAdmin()` | `[ORG_OWNER, ORG_ADMIN]` |
| `isReadOnly()` | `[ORG_VIEWER, PUBLIC_USER]` |
| `isPublicUser()` | `PUBLIC_USER` sin `organizationId` |

### Permisos por Rol

```typescript
SUPER_ADMIN: {
  canManageUsers: true,
  canManageLicitaciones: true,
  canViewAnalytics: true,
  canManagePlan: true,
}

ORG_OWNER: {
  canManageUsers: true,
  canManageLicitaciones: true,
  canViewAnalytics: true,
  canManagePlan: true,
}

ORG_ADMIN: {
  canManageUsers: true,
  canManageLicitaciones: true,
  canViewAnalytics: true,
  canManagePlan: false,  // ← NO puede cambiar plan
}

ORG_MEMBER: {
  canManageUsers: false,
  canManageLicitaciones: true,
  canViewAnalytics: false,
  canManagePlan: false,
}

ORG_VIEWER: {
  canManageUsers: false,
  canManageLicitaciones: false,
  canViewAnalytics: true,
  canManagePlan: false,
}

PUBLIC_USER: {
  canManageUsers: false,
  canManageLicitaciones: false,
  canViewAnalytics: false,
  canManagePlan: false,
}
```

### Permisos por Plan

```typescript
FREE: {
  canCreatePipelines: false,
  canCreateAlerts: true,
  canUseIntegrations: false,
  canUseWorkflows: false,
  canAccessHistorical: false,
}

PRO: {
  canCreatePipelines: true,
  canCreateAlerts: true,
  canUseIntegrations: false,
  canUseWorkflows: false,
  canAccessHistorical: true,
}

ADVANCED: {
  canCreatePipelines: true,
  canCreateAlerts: true,
  canUseIntegrations: false,
  canUseWorkflows: false,
  canAccessHistorical: true,
}

ENTERPRISE: {
  canCreatePipelines: true,
  canCreateAlerts: true,
  canUseIntegrations: true,
  canUseWorkflows: true,
  canAccessHistorical: true,
}
```

---

## 11. TODAS LAS REFERENCIAS A ORG_ADMIN Y ORG_VIEWER EN EL CÓDIGO

### Archivo: src/modules/users/enums/index.ts

**Línea 4:** Definición del enum
```typescript
ORG_ADMIN = 'ORG_ADMIN',
```

**Línea 6:** Definición del enum
```typescript
ORG_VIEWER = 'ORG_VIEWER',
```

---

### Archivo: src/common/decorators/roles.decorator.ts

**Línea 21:** En decorador `RequireOrgAdmin()`
```typescript
SetMetadata('roles', [Role.SUPER_ADMIN, Role.ORG_OWNER, Role.ORG_ADMIN]);
```

---

### Archivo: src/common/guards/role.guard.ts

**Línea 16:** En comentario documentando el guard
```typescript
* Se usa con el decorador @RequireRoles(Role.ORG_OWNER, Role.ORG_ADMIN)
```

---

### Archivo: src/modules/users/modules/permissions/permissions.service.ts

**Línea 38:** En definición de permisos de ORG_ADMIN
```typescript
[Role.ORG_ADMIN]: {
  canManageUsers: true,
  canManageLicitaciones: true,
  canViewAnalytics: true,
  canManagePlan: false,
},
```

**Línea 50:** En definición de permisos de ORG_VIEWER
```typescript
[Role.ORG_VIEWER]: {
  canManageUsers: false,
  canManageLicitaciones: false,
  canViewAnalytics: true,
  canManagePlan: false,
},
```

**Línea 164:** En método `canManageUsers()`
```typescript
return [Role.SUPER_ADMIN, Role.ORG_OWNER, Role.ORG_ADMIN].includes(
  user.role,
);
```

**Línea 178:** En método `canManageLicitaciones()`
```typescript
Role.ORG_ADMIN,
```

**Línea 192-193:** En método `canViewAnalytics()`
```typescript
Role.ORG_ADMIN,
Role.ORG_VIEWER,
```

**Línea 330:** En comentario del método `isOrgAdmin()`
```typescript
* @returns true si es ORG_OWNER o ORG_ADMIN
```

**Línea 333:** En método `isOrgAdmin()`
```typescript
return [Role.ORG_OWNER, Role.ORG_ADMIN].includes(user.role);
```

**Línea 339:** En comentario del método `isReadOnly()`
```typescript
* @returns true si es ORG_VIEWER o PUBLIC_USER
```

**Línea 342:** En método `isReadOnly()`
```typescript
return [Role.ORG_VIEWER, Role.PUBLIC_USER].includes(user.role);
```

---

## 12. RESUMEN DE CAMBIOS NECESARIOS

### ✅ Bien Documentado
- [x] Enum Role y Plan definidos
- [x] Decoradores de roles y planes
- [x] Guards para validación
- [x] Entities mapeadas correctamente
- [x] PermissionsService completo

### ⚠️ Requiere Implementación
- [ ] **Auth Module** - DTOs vacíos, servicios template boilerplate
- [ ] **Auth Controller** - Sin endpoints de login/registro/refresh
- [ ] **Auth Service** - Sin lógica de JWT, autenticación o validación
- [ ] Integración de Guards en endpoints
- [ ] Middleware de autenticación

### 📋 Checklist de Referencias ORG_ADMIN y ORG_VIEWER

- ✅ ORG_ADMIN aparece en **8 ubicaciones** en el código TypeScript
- ✅ ORG_VIEWER aparece en **6 ubicaciones** en el código TypeScript
- ✅ Todas las referencias están concentradas en: enums, decorators, guards y permissions.service

---

## 13. DIAGRAMA DE FLUJO DE PERMISOS

```
Request (Usuario autenticado)
    ↓
RoleGuard → Verifica @RequireRoles()
    ↓
PlanGuard → Verifica @RequirePlans()
    ↓
PermissionsGuard → Validaciones complejas
    ↓
Endpoint ejecutado
```

### Ejemplo de uso:

```typescript
@Post('users/promote')
@RequireOrgAdmin()                      // Decorador: solo admins org
@UseGuards(RoleGuard, PermissionsGuard)  // Guards de validación
async promoteUser(@Body() promoteDto: PromoteUserDto) {
  return this.usersService.promoteToOrgOwner(promoteDto.userId, promoteDto.orgId);
}
```

---

## 14. TABLA RESUMEN DE ARCHIVOS

| Archivo | Líneas | Propósito | Estado |
|---------|--------|----------|--------|
| enums/index.ts | 24 | Role, Plan enums | ✅ Completo |
| users.service.ts | ~500 | Métodos CRUD, promoción | ✅ Completo |
| users.controller.ts | ~100 | Endpoints | ✅ Completo |
| users.entity.ts | ~80 | Mapeo DB | ✅ Completo |
| role.entity.ts | ~20 | Mapeo DB | ✅ Completo |
| organization.entity.ts | ~50 | Mapeo DB | ✅ Completo |
| dto/create-user.dto.ts | ~35 | Validación entrada | ✅ Completo |
| dto/update-user.dto.ts | ~25 | Validación entrada | ✅ Completo |
| decorators/roles.decorator.ts | ~25 | Metadata de roles | ✅ Completo |
| decorators/plans.decorator.ts | ~25 | Metadata de planes | ✅ Completo |
| guards/role.guard.ts | ~60 | Validación rol | ✅ Completo |
| guards/plan.guard.ts | ~80 | Validación plan | ✅ Completo |
| guards/permissions.guard.ts | ~60 | Validación combinada | ✅ Completo |
| permissions.service.ts | ~400 | Lógica de permisos | ✅ Completo |
| auth/auth.service.ts | ~30 | ⚠️ Template boilerplate | ❌ TODO |
| auth/auth.controller.ts | ~30 | ⚠️ Template boilerplate | ❌ TODO |
| auth/dto/create-auth.dto.ts | ~1 | ⚠️ Vacío | ❌ TODO |

---

## 15. NOTES & OBSERVACIONES

1. **ORG_ADMIN puede gestionar usuarios pero NO el plan** - Solo ORG_OWNER y SUPER_ADMIN pueden cambiar el plan
2. **ORG_VIEWER tiene acceso de solo lectura** - Puede ver analytics pero no modificar nada
3. **El módulo Auth necesita implementación completa** - Actualmente es un template
4. **Transacciones en createUser y promoteToOrgOwner** - Garantiza consistencia de datos
5. **Password hasheada con bcrypt (10 rounds)** - NO se selecciona por defecto en queries
6. **PermissionsService es el centro de lógica de autorización** - Todos los guards y servicios la usan

---

**Generado:** 16 de abril de 2026
**Última revisión:** Exploración completa del codebase
