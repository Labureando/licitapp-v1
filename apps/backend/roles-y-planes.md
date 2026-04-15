# Roles y Planes del Sistema

Documento de referencia para el desarrollo de la plataforma de contratación pública.

---

## Contexto

La plataforma maneja dos dimensiones independientes que **siempre van juntas**:

- **Rol** → controla *qué puede hacer* un usuario dentro de su organización  
- **Plan** → controla *cuánto puede usar* una organización (límites, features, IA)

Un `ORG_MEMBER` en plan `FREE` tiene permisos operativos pero acceso limitado a features. Ese mismo `ORG_MEMBER` en plan `ENTERPRISE` tiene acceso completo. El rol no cambia; el plan sí expande las capacidades.

---

## Enum Role

enum Role {

  SUPER\_ADMIN   // Acceso total a la plataforma (solo el equipo interno)

  ORG\_OWNER     // Quien crea la organización y gestiona la suscripción

  ORG\_ADMIN     // Admin delegado por el Owner

  ORG\_MEMBER    // Usuario operativo del día a día

  ORG\_VIEWER    // Solo lectura, sin poder modificar nada

  PUBLIC\_USER   // Registro sin organización asignada (freemium / trial)

}

### Descripción de cada rol

| Rol | Quién es | Puede hacer |
| :---- | :---- | :---- |
| `SUPER_ADMIN` | Tú / equipo interno | Todo. Accede a cualquier organización, gestiona planes, modera contenido |
| `ORG_OWNER` | El que paga / fundador de la org | Gestiona usuarios, cambia plan, acceso total dentro de su org |
| `ORG_ADMIN` | Admin delegado por el Owner | Gestiona usuarios y licitaciones, no puede cambiar plan ni billing |
| `ORG_MEMBER` | Usuario operativo | Busca licitaciones, gestiona pipelines, usa la IA |
| `ORG_VIEWER` | Consultor externo / auditor | Solo lee. No puede crear, editar ni exportar |
| `PUBLIC_USER` | Registro nuevo sin org | Acceso limitado al buscador público, sin features de equipo |

---

## Enum Plan

enum Plan {

  FREE        // Trial / acceso básico

  PRO         // Equivalente al Business de Tendios

  ADVANCED    // Volumen alto, más pipelines y créditos IA

  ENTERPRISE  // Personalizado, sin límites definidos

}

### Límites por plan

| Feature | FREE | PRO | ADVANCED | ENTERPRISE |
| :---- | :---- | :---- | :---- | :---- |
| Usuarios | 1 | 3 | 4 | Ilimitado |
| Alertas | 1 | 3 | 4 | Personalizadas |
| Pipelines | 0 | 1 | 2 | 100+ |
| Créditos IA / mes | 50 | 500 | 1.000 | 10.000+ |
| Histórico adjudicaciones | — | 2 años | 4 años | Personalizado |
| Integraciones (Slack, CRM…) | — | — | — | ✓ |
| Workflows personalizados | — | — | — | ✓ |

---

## Modelo de datos sugerido (Prisma)

model User {

  id          String   @id @default(cuid())

  email       String   @unique

  role        Role     @default(PUBLIC\_USER)

  orgId       String?

  org         Org?     @relation(fields: \[orgId\], references: \[id\])

  createdAt   DateTime @default(now())

}

model Org {

  id        String   @id @default(cuid())

  name      String

  plan      Plan     @default(FREE)

  users     User\[\]

  createdAt DateTime @default(now())

}

---

## Lógica de permisos (ejemplo TypeScript)

La idea es separar **el rol** de **el plan** en los guards:

// Verifica si el usuario puede gestionar otros usuarios

function canManageUsers(user: User): boolean {

  return \[Role.SUPER\_ADMIN, Role.ORG\_OWNER, Role.ORG\_ADMIN\].includes(user.role)

}

// Verifica si la org tiene acceso a una feature según su plan

function canUsePipelines(org: Org): boolean {

  return \[Plan.ADVANCED, Plan.ENTERPRISE\].includes(org.plan)

}

// Verifica si puede usar integraciones externas

function canUseIntegrations(user: User, org: Org): boolean {

  return canManageUsers(user) && org.plan \=== Plan.ENTERPRISE

}

---

## Flujo de registro

Usuario se registra

        │

        ▼

   PUBLIC\_USER  ──── crea una organización ────▶  ORG\_OWNER (plan FREE)

                                                        │

                                                   invita usuarios

                                                        │

                                              ORG\_ADMIN / ORG\_MEMBER / ORG\_VIEWER

---

## Notas de desarrollo

- El `SUPER_ADMIN` **nunca pertenece a una organización** (`orgId = null`).  
- Un `ORG_OWNER` **no puede ser degradado** a `ORG_MEMBER` directamente; primero debe transferir la propiedad.  
- El `PUBLIC_USER` se convierte en `ORG_OWNER` automáticamente al crear su primera organización.  
- Los límites del plan deben validarse **en el backend**, nunca solo en el frontend.  
- Considera una tabla `Permission` adicional si en el futuro necesitas permisos granulares por recurso (por licitación, por pipeline, etc.).

