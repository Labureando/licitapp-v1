# Roles y Planes del Sistema

Documento de referencia para el desarrollo de la plataforma de contratación pública.

---

## Contexto

La plataforma tiene **DOS modelos de planes independientes**:

### 1. Usuarios Individuales (PUBLIC_USER)
- Planes con suscripción **MENSUAL**
- 3 opciones: FREE, PRO, ADVANCED
- Cada usuario paga su propio plan
- **Controlan**: créditos IA, alertas, features de búsqueda

### 2. Organizaciones (ORG_OWNER + ORG_MEMBER)
- Planes **OBLIGATORIAMENTE PAGOS** (no hay FREE)
- 2 opciones: STARTER, PROFESSIONAL
- ORG_OWNER paga por toda la organización
- **Controlan**: número de usuarios, alertas, features

**Cuando PUBLIC_USER crea organización:**
- Siempre comienza en plan **STARTER** (debe pagar)
- Puede upgradear a PROFESSIONAL pagando diferencia
- Su plan individual (PRO/ADVANCED) NO se transfiere
- Si deja la org, vuelve a su plan individual

---

## Enum Role

enum Role {

  SUPER_ADMIN   // Acceso total a la plataforma (solo el equipo interno)

  ORG_OWNER     // Quien crea la organización, gestiona suscripción y usuarios

  ORG_MEMBER    // Usuario operativo - acceso a alertas, búsqueda, análisis

  PUBLIC_USER   // Registro sin organización - acceso limitado al buscador público

}

### Descripción de cada rol

| Rol | Quién es | Puede hacer |
| :---- | :---- | :---- |
| `SUPER_ADMIN` | Tú / equipo interno | Todo. Accede a cualquier organización, gestiona planes, modera contenido |
| `ORG_OWNER` | El que paga / fundador de la org | ✓ Gestiona usuarios (invitar/promover) <br> ✓ Cambia plan/billing <br> ✓ Crea alertas <br> ✓ Busca licitaciones <br> ✓ Analiza pliegos (IA) <br> ✓ Ve reportes |
| `ORG_MEMBER` | Usuarios invitados a la org | ✓ Crea alertas <br> ✓ Busca licitaciones <br> ✓ Analiza pliegos (IA) <br> ✓ Ve reportes <br> ✗ NO gestiona usuarios <br> ✗ NO cambia plan |
| `PUBLIC_USER` | Registro nuevo sin org | ✓ Acceso limitado al buscador público <br> ✗ NO crea alertas <br> ✗ NO usa IA |

---

## Enum Plan

enum Plan {

  FREE        // Solo para usuarios individuales (PUBLIC_USER)

  PRO         // Usuarios individuales

  ADVANCED    // Usuarios individuales

  STARTER     // Organizaciones (PAGO)

  PROFESSIONAL // Organizaciones (PAGO)

}

### Aplicabilidad

| Plan | Aplica a | Costo |
|------|----------|-------|
| `FREE` | PUBLIC_USER | Gratis ∞ |
| `PRO` | PUBLIC_USER | $XX/mes |
| `ADVANCED` | PUBLIC_USER | $XX/mes |
| `STARTER` | Organización | $XX/mes (obligatorio) |
| `PROFESSIONAL` | Organización | $XXX/mes (obligatorio) |

### Límites por plan

#### Usuarios Individuales (PUBLIC_USER)

| Feature | FREE | PRO | ADVANCED |
|---------|------|-----|----------|
| Costo | Gratis | $XX/mes | $XX/mes |
| Análisis de pliegos (IA) / mes | 50 créditos | 500 créditos | 1.000 créditos |
| Alertas de monitoreo | 1 | 5 | 10 |
| Búsqueda de licitaciones | ✓ Básica | ✓ Avanzada | ✓ Premium |
| Histórico de licitaciones | 3 meses | 6 meses | 1 año |
| Exportar reportes | — | ✓ | ✓ |

#### Organizaciones (ORG_OWNER + ORG_MEMBER)

| Feature | STARTER | PROFESSIONAL |
|---------|---------|--------------|
| Costo | $XX/mes (obligatorio) | $XXX/mes (obligatorio) |
| Usuarios | 3 | 10 |
| Alertas de monitoreo | 5 | 15 |
| Análisis de pliegos (IA) / mes | 500 créditos | 5.000 créditos |
| Búsqueda de licitaciones | ✓ Avanzada | ✓ Premium |
| Histórico de licitaciones | 6 meses | 2 años |
| Exportar reportes | ✓ | ✓ |
| Webhooks / Integraciones | — | ✓ |   

---

## Lógica de permisos (ejemplo TypeScript)

La idea es separar **el rol** de **el plan** en los guards:

```typescript
// Gestionar usuarios (invitar, promover, remover) - solo ORG_OWNER
function canManageUsers(user: User): boolean {
  return [Role.SUPER_ADMIN, Role.ORG_OWNER].includes(user.role)
}

// Crear alertas - usuarios org + individuales (según su plan)
function canCreateAlerts(user: User, org?: Org): boolean {
  const hasRole = [Role.SUPER_ADMIN, Role.ORG_OWNER, Role.ORG_MEMBER].includes(user.role)
  if (!hasRole) return false
  
  // Si es PUBLIC_USER, usa su plan individual
  if (user.role === Role.PUBLIC_USER) {
    return user.userPlan !== Plan.FREE // PRO y ADVANCED pueden crear alertas
  }
  
  // Si es en org, verifica que la org no alcanzó límite
  if (org) {
    return org.plan in [Plan.STARTER, Plan.PROFESSIONAL]
  }
  
  return false
}

// Usar IA (análisis de pliegos)
function canUseAI(user: User, org?: Org): boolean {
  const hasRole = [Role.SUPER_ADMIN, Role.ORG_OWNER, Role.ORG_MEMBER].includes(user.role)
  if (!hasRole) return false
  
  if (user.role === Role.PUBLIC_USER) {
    return user.userPlan !== Plan.FREE // PRO y ADVANCED
  }
  
  return org?.plan in [Plan.STARTER, Plan.PROFESSIONAL]
}

// Cambiar suscripción (solo ORG_OWNER para org, o PUBLIC_USER para sí mismo)
function canChangeSubscription(user: User): boolean {
  return [Role.SUPER_ADMIN, Role.ORG_OWNER].includes(user.role)
}

// PUBLIC_USER solo puede upgradear su propio plan individual
function canUpgradeOwnPlan(user: User, targetUserId: string): boolean {
  return user.role === Role.PUBLIC_USER && user.id === targetUserId
}
```

---

## Flujo de registro y planes

### Flujo 1: Usuario individual sin organización

```
Usuario se registra

        │

        ▼

   PUBLIC_USER (plan FREE)  ──┬──> Quiere más? Upgrade a PRO ($XX/mes)
                               │
                               └──> Upgrade a ADVANCED ($XX/mes)
```

### Flujo 2: Usuario crea organización

```
PUBLIC_USER (plan PRO/ADVANCED)

        │

        ▼

Crea una organización

        │

        ▼

ORG_OWNER (plan STARTER - PAGO)  ──┬──> Invita usuarios → ORG_MEMBER
                                    │
                                    └──> Quiere más? Upgrade a PROFESSIONAL
```

**Nota**: El plan individual del PUBLIC_USER NO se transfiere a la org. Son independientes.

---

## Notas de desarrollo

- El `SUPER_ADMIN` **nunca pertenece a una organización** (`orgId = null`).  
- Un `ORG_OWNER` **no puede ser degradado** a `ORG_MEMBER` directamente; primero debe transferir la propiedad a otro usuario.  
- El `PUBLIC_USER` se convierte en `ORG_OWNER` automáticamente al crear su primera organización.  
- Un `ORG_OWNER` es automáticamente también admin: gestiona usuarios Y puede usar alertas/búsqueda/IA.
- Los `ORG_MEMBER` invitados **heredan el plan de la organización**, NO tienen plan propio.
- **Planes de usuarios (FREE, PRO, ADVANCED) son independientes del plan de organización.**
- Cuando PUBLIC_USER crea org, **comienza SIEMPRE en STARTER** (debe pagar nuevamente).
- No existe plan FREE para organizaciones (todas son pagos).
- Los límites del plan deben validarse **en el backend**, nunca solo en el frontend.  
- Licitaciones son solo LECTURA: búsqueda, monitoreo, análisis. No se crean licitaciones en la plataforma.
- **Suscripción mensual**: Tanto usuarios como orgs se renuevan mes a mes (Stripe integration later).

