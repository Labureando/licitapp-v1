# 📋 Auditoría Completa de Endpoints - Backend NestJS

**Fecha:** 17 de abril de 2026  
**Estado:** Resumen ejecutivo de documentación Swagger...

---

## 📊 Resumen General

| Controlador | Endpoints | Documentación Swagger | Estado |
|---|---|---|---|
| **auth.controller.ts** | 8 | ✅ COMPLETA | Bien documentado |
| **users.controller.ts** | 10 | ⚠️ PARCIAL | Sin decoradores @Api* |
| **health.controller.ts** | 3 | ✅ BÁSICA | Minimal pero presente |
| **licitaciones.controller.ts** | 3 | ✅ BÁSICA | Swagger presente |
| **scraping.controller.ts** | 5 | ✅ COMPLETA | Bien documentado |
| **invitations.controller.ts** | 4 | ⚠️ SIN SWAGGER | Solo comentarios JSDoc |
| **organizations.controller.ts** | 5 | ⚠️ SIN SWAGGER | Solo comentarios JSDoc |
| **app.controller.ts** | 1 | ❌ SIN DOCUMENTACIÓN | Root endpoint |

**Total de Endpoints:** 39  
**Con Swagger:** 28 (71.8%)  
**Sin Swagger:** 11 (28.2%)

---

## 🔐 1. AUTH.CONTROLLER.TS ✅ COMPLETA

**Decoradores Presentes:** `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody`, `@ApiParam`, `@ApiBearerAuth`, `@ApiHeader`, `@ApiExtraModels`

### Endpoint 1: POST /auth/login
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** POST
- **Ruta:** `/auth/login`
- **Rate Limit:** 5 requests/15 min
- **Brute Force:** IP bloqueada después de 5 fallos
- **Body (Required):**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Respuesta 200 (OK):**
  ```json
  {
    "access_token": "JWT",
    "refresh_token": "JWT",
    "user": {
      "id": "UUID",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "PUBLIC_USER|ORG_OWNER|SUPER_ADMIN",
      "isActive": "boolean",
      "createdAt": "ISO8601"
    }
  }
  ```
- **Códigos de Estado:**
  - `200 OK` - Login exitoso
  - `401 Unauthorized` - Credenciales inválidas
  - `429 Too Many Requests` - Rate limit excedido
- **Headers Retornados:**
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
- **Autenticación:** No requerida
- **Notas:** Token access válido 1h, refresh válido 7 días

---

### Endpoint 2: POST /auth/refresh
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** POST
- **Ruta:** `/auth/refresh`
- **Body (Required):**
  ```json
  {
    "refresh_token": "JWT"
  }
  ```
- **Respuesta 200 (OK):**
  ```json
  {
    "access_token": "JWT",
    "refresh_token": "JWT (nuevo)"
  }
  ```
- **Códigos de Estado:**
  - `200 OK` - Token renovado
  - `401 Unauthorized` - Refresh token inválido/expirado
- **Autenticación:** No requerida
- **Notas:** Refresh token se rota automáticamente

---

### Endpoint 3: POST /auth/logout
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** POST
- **Ruta:** `/auth/logout`
- **Autenticación:** ✅ Bearer Token (JWT)
- **Body (Required):**
  ```json
  {
    "refresh_token": "JWT"
  }
  ```
- **Respuesta 200 (OK):**
  ```json
  {
    "message": "Sesión cerrada exitosamente"
  }
  ```
- **Códigos de Estado:**
  - `200 OK` - Logout exitoso
  - `401 Unauthorized` - Token inválido/expirado

---

### Endpoint 4: GET /auth/me
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** GET
- **Ruta:** `/auth/me`
- **Autenticación:** ✅ Bearer Token (JWT)
- **Parámetros:** Ninguno
- **Body:** No requerido
- **Respuesta 200 (OK):**
  ```json
  {
    "id": "UUID",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "role": "PUBLIC_USER|ORG_OWNER|SUPER_ADMIN",
    "userPlan": "FREE|PREMIUM|ENTERPRISE",
    "isActive": "boolean",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
  ```
- **Códigos de Estado:**
  - `200 OK` - Perfil obtenido
  - `401 Unauthorized` - Token inválido/expirado

---

### Endpoint 5: POST /auth/signup
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** POST
- **Ruta:** `/auth/signup` (Step 1 de 2)
- **Rate Limit:** 5 requests/15 min
- **Brute Force:** IP bloqueada después de 5 fallos
- **Body (Required):**
  ```json
  {
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
  ```
- **Respuesta 201 (CREATED):**
  ```json
  {
    "message": "Se ha enviado un email a user@example.com con las instrucciones para completar tu registro. El enlace es válido por 24 horas."
  }
  ```
- **Códigos de Estado:**
  - `201 Created` - Usuario creado, email enviado
  - `400 Bad Request` - Email ya registrado o datos inválidos
  - `429 Too Many Requests` - Rate limit excedido
- **Autenticación:** No requerida
- **Notas:** Usuario creado en estado INACTIVO. Token verificación válido 24h

---

### Endpoint 6: POST /auth/complete-signup/:token
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** POST
- **Ruta:** `/auth/complete-signup/:token` (Step 2 de 2)
- **Parámetros:**
  - `token` (path) - Token de verificación enviado por email (24h validez)
- **Rate Limit:** 5 requests/15 min
- **Brute Force:** IP bloqueada después de 5 fallos
- **Body (Required):**
  ```json
  {
    "password": "string",
    "confirmPassword": "string"
  }
  ```
- **Respuesta 200 (OK):**
  ```json
  {
    "access_token": "JWT",
    "refresh_token": "JWT",
    "user": {
      "id": "UUID",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "PUBLIC_USER",
      "isActive": "boolean",
      "createdAt": "ISO8601"
    }
  }
  ```
- **Códigos de Estado:**
  - `200 OK` - Registro completado, usuario autenticado
  - `400 Bad Request` - Token inválido/expirado o contraseñas no coinciden
  - `429 Too Many Requests` - Rate limit excedido
- **Autenticación:** No requerida
- **Notas:** Login automático después de registro. Token se elimina tras usar.

---

### Endpoint 7: GET /auth/google
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** GET
- **Ruta:** `/auth/google`
- **Parámetros:** Ninguno
- **Respuesta:** 302 Redirect a Google OAuth
- **Códigos de Estado:**
  - `302 Found` - Redirige a Google OAuth
- **Autenticación:** No requerida
- **Notas:** Inicia flujo OAuth 2.0 con Google

---

### Endpoint 8: GET /auth/google/callback
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** GET
- **Ruta:** `/auth/google/callback`
- **Parámetros:** `code`, `state` (manejados por Google)
- **Respuesta:** 302 Redirect al frontend con tokens en URL
- **URL Redirect Exitoso:**
  ```
  http://localhost:3000/auth/callback?access_token=JWT&refresh_token=JWT
  ```
- **URL Redirect Error:**
  ```
  http://localhost:3000/auth/error?message=Error%20message
  ```
- **Códigos de Estado:**
  - `302 Found` - Redirige al frontend
  - `400 Bad Request` - Email ya registrado sin Google
- **Autenticación:** No requerida (OAuth)
- **Notas:** Callback automático de Google. Crea usuario si no existe.

---

## 👥 2. USERS.CONTROLLER.TS ⚠️ PARCIAL

**Decoradores Presentes:** ❌ Ningún decorador @Api*  
**Documentación:** Solo comentarios JSDoc

### Endpoint 1: GET /users
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** GET
- **Ruta:** `/users`
- **Parámetros:** Ninguno
- **Respuesta 200:**
  ```json
  [
    {
      "id": "UUID",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "PUBLIC_USER|ORG_OWNER|SUPER_ADMIN"
    }
  ]
  ```
- **Códigos de Estado:** `200 OK`
- **Autenticación:** Probablemente requerida (no especificado)
- **Notas:** Solo admin

---

### Endpoint 2: GET /users/organization/:organizationId
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** GET
- **Ruta:** `/users/organization/:organizationId`
- **Parámetros:**
  - `organizationId` (path) - UUID de la organización
- **Respuesta 200:**
  ```json
  [
    {
      "id": "UUID",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "organizationId": "UUID"
    }
  ]
  ```
- **Códigos de Estado:** `200 OK`

---

### Endpoint 3: GET /users/:userId
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** GET
- **Ruta:** `/users/:userId`
- **Parámetros:**
  - `userId` (path) - UUID del usuario
- **Respuesta 200:**
  ```json
  {
    "id": "UUID",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `404 Not Found`

---

### Endpoint 4: PATCH /users/:userId
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** PATCH
- **Ruta:** `/users/:userId`
- **Parámetros:**
  - `userId` (path) - UUID del usuario
- **Body (Parcial):**
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "phone": "string"
  }
  ```
- **Respuesta 200:**
  ```json
  {
    "id": "UUID",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string"
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `400 Bad Request`
  - `404 Not Found`

---

### Endpoint 5: POST /users/:userId/deactivate
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** POST
- **Ruta:** `/users/:userId/deactivate`
- **Parámetros:**
  - `userId` (path) - UUID del usuario
- **Body:** No requerido
- **Respuesta:** 204 No Content
- **Códigos de Estado:**
  - `204 No Content` - Usuario desactivado
  - `404 Not Found`

---

### Endpoint 6: POST /users/:userId/activate
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** POST
- **Ruta:** `/users/:userId/activate`
- **Parámetros:**
  - `userId` (path) - UUID del usuario
- **Body:** No requerido
- **Respuesta 200:**
  ```json
  {
    "id": "UUID",
    "email": "string",
    "isActive": true
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `404 Not Found`

---

### Endpoint 7: DELETE /users/:userId
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** DELETE
- **Ruta:** `/users/:userId`
- **Parámetros:**
  - `userId` (path) - UUID del usuario
- **Body:** No requerido
- **Respuesta:** 204 No Content
- **Códigos de Estado:**
  - `204 No Content` - Usuario eliminado
  - `404 Not Found`

---

### Endpoint 8: POST /users/password/request
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** POST
- **Ruta:** `/users/password/request`
- **Body (Required):**
  ```json
  {
    "email": "string"
  }
  ```
- **Respuesta 200:**
  ```json
  {
    "message": "Email de recuperación enviado"
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `400 Bad Request`

---

### Endpoint 9: POST /users/password/confirm
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** POST
- **Ruta:** `/users/password/confirm`
- **Body (Required):**
  ```json
  {
    "token": "string",
    "newPassword": "string"
  }
  ```
- **Respuesta 200:**
  ```json
  {
    "message": "Contraseña actualizada"
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `400 Bad Request` - Token inválido/expirado

---

### Endpoint 10: PATCH /users/password/change
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** PATCH
- **Ruta:** `/users/password/change`
- **Autenticación:** ✅ Bearer Token (JWT)
- **Body (Required):**
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```
- **Respuesta 200:**
  ```json
  {
    "message": "Contraseña actualizada"
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `401 Unauthorized` - Contraseña anterior incorrecta
  - `400 Bad Request`

---

## 🏥 3. HEALTH.CONTROLLER.TS ✅ BÁSICA

**Decoradores Presentes:** `@ApiTags`, `@ApiOperation`

### Endpoint 1: GET /health
- **Decoradores Swagger:** ✅ Presentes
- **Método HTTP:** GET
- **Ruta:** `/health`
- **Parámetros:** Ninguno
- **Respuesta 200:**
  ```json
  {
    "status": "OK",
    "timestamp": "ISO8601",
    "uptime": 12345.67
  }
  ```
- **Códigos de Estado:** `200 OK`
- **Autenticación:** No requerida

---

### Endpoint 2: GET /health/ready
- **Decoradores Swagger:** ✅ Presentes
- **Método HTTP:** GET
- **Ruta:** `/health/ready`
- **Respuesta 200:**
  ```json
  {
    "ready": true,
    "timestamp": "ISO8601"
  }
  ```
- **Códigos de Estado:** `200 OK`
- **Autenticación:** No requerida
- **Notas:** Readiness probe (K8s)

---

### Endpoint 3: GET /health/live
- **Decoradores Swagger:** ✅ Presentes
- **Método HTTP:** GET
- **Ruta:** `/health/live`
- **Respuesta 200:**
  ```json
  {
    "alive": true,
    "timestamp": "ISO8601"
  }
  ```
- **Códigos de Estado:** `200 OK`
- **Autenticación:** No requerida
- **Notas:** Liveness probe (K8s)

---

## 🏛️ 4. LICITACIONES.CONTROLLER.TS ✅ BÁSICA

**Decoradores Presentes:** `@ApiTags`, `@ApiOperation`, `@ApiResponse`

### Endpoint 1: GET /licitaciones
- **Decoradores Swagger:** ✅ Presentes
- **Método HTTP:** GET
- **Ruta:** `/licitaciones`
- **Query Parameters (Filtros):**
  ```
  search: string (full-text)
  estado: string
  tipo: string
  ccaa: string
  importe: number
  fechaDesde: ISO8601
  fechaHasta: ISO8601
  page: number
  limit: number
  ```
- **Respuesta 200:**
  ```json
  {
    "data": [
      {
        "id": "UUID",
        "titulo": "string",
        "estado": "ABIERTA|ADJUDICADA",
        "importe": "number",
        "fechaPublicacion": "ISO8601"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `400 Bad Request` - Filtros inválidos
- **Autenticación:** No especificada

---

### Endpoint 2: GET /licitaciones/filters
- **Decoradores Swagger:** ✅ Presentes
- **Método HTTP:** GET
- **Ruta:** `/licitaciones/filters`
- **Parámetros:** Ninguno
- **Respuesta 200:**
  ```json
  {
    "estados": ["ABIERTA", "ADJUDICADA"],
    "tipos": ["string"],
    "ccaa": ["string"],
    "procedimientos": ["string"]
  }
  ```
- **Códigos de Estado:** `200 OK`

---

### Endpoint 3: GET /licitaciones/:id
- **Decoradores Swagger:** ✅ Presentes
- **Método HTTP:** GET
- **Ruta:** `/licitaciones/:id`
- **Parámetros:**
  - `id` (path) - UUID de la licitación
- **Respuesta 200:**
  ```json
  {
    "id": "UUID",
    "titulo": "string",
    "descripcion": "string",
    "estado": "string",
    "importe": "number",
    "documentos": [
      {
        "nombre": "string",
        "url": "string"
      }
    ],
    "organoCont ratacion": {
      "nombre": "string",
      "email": "string"
    }
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `404 Not Found`

---

## 🤖 5. SCRAPING.CONTROLLER.TS ✅ COMPLETA

**Decoradores Presentes:** `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`

### Endpoint 1: POST /scraping/place/run
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** POST
- **Ruta:** `/scraping/place/run`
- **Estado HTTP:** 202 ACCEPTED
- **Body (Opcional):**
  ```json
  {
    "maxPages": 3
  }
  ```
- **Respuesta 202:**
  ```json
  {
    "jobId": "UUID",
    "status": "PENDING",
    "message": "Scraping iniciado exitosamente"
  }
  ```
- **Códigos de Estado:**
  - `202 Accepted` - Scraping iniciado
  - `400 Bad Request`
- **Autenticación:** Probablemente requerida
- **Notas:** Ejecución asincrónica

---

### Endpoint 2: POST /scraping/place/historical/:period
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** POST
- **Ruta:** `/scraping/place/historical/:period`
- **Parámetros:**
  - `period` (path) - Formato YYYY o YYYYMM (ej: 2024, 202604)
- **Body:** No requerido
- **Respuesta 202:**
  ```json
  {
    "status": "PENDING",
    "message": "Carga de histórico iniciada"
  }
  ```
- **Códigos de Estado:**
  - `202 Accepted`
  - `400 Bad Request` - Período inválido

---

### Endpoint 3: POST /scraping/place/historical-all
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** POST
- **Ruta:** `/scraping/place/historical-all`
- **Body:** No requerido
- **Respuesta 202:**
  ```json
  [
    {
      "period": "2024",
      "newItems": 1000,
      "errors": 5,
      "duration": "60s"
    }
  ]
  ```
- **Códigos de Estado:** `202 Accepted`
- **Duración Estimada:** 30-60 minutos

---

### Endpoint 4: GET /scraping/stats
- **Decoradores Swagger:** ✅ Completos
- **Método HTTP:** GET
- **Ruta:** `/scraping/stats`
- **Parámetros:** Ninguno
- **Respuesta 200:**
  ```json
  {
    "totalLicitaciones": 5420,
    "abiertas": 1230,
    "adjudicadas": 4190,
    "ultimoScraping": {
      "fecha": "ISO8601",
      "estado": "SUCCESS|PARTIAL|PENDING",
      "nuevas": 150,
      "actualizadas": 45,
      "errores": 2,
      "duracion": "5230ms"
    }
  }
  ```
- **Códigos de Estado:** `200 OK`

---

## 📨 6. INVITATIONS.CONTROLLER.TS ⚠️ SIN SWAGGER

**Decoradores Presentes:** ❌ Ningún decorador @Api*  
**Documentación:** Solo comentarios JSDoc

### Endpoint 1: POST /invitations
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** POST
- **Ruta:** `/invitations`
- **Autenticación:** ✅ Bearer Token (JWT) + Role Guard
- **Roles Requeridos:** ORG_OWNER
- **Body (Required):**
  ```json
  {
    "email": "string",
    "organizationId": "UUID",
    "role": "ORG_OWNER|ORG_MEMBER"
  }
  ```
- **Respuesta 201:**
  ```json
  {
    "id": "UUID",
    "email": "string",
    "token": "string",
    "expiresAt": "ISO8601"
  }
  ```
- **Códigos de Estado:**
  - `201 Created`
  - `403 Forbidden` - No es ORG_OWNER
  - `400 Bad Request`

---

### Endpoint 2: POST /invitations/:token/accept
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** POST
- **Ruta:** `/invitations/:token/accept`
- **Autenticación:** ❌ Pública (sin autenticación)
- **Parámetros:**
  - `token` (path) - Token de invitación
- **Body:** No requerido
- **Respuesta 200:**
  ```json
  {
    "message": "Invitación aceptada",
    "userId": "UUID",
    "organizationId": "UUID"
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `400 Bad Request` - Token inválido/expirado

---

### Endpoint 3: GET /invitations/organization/:organizationId
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** GET
- **Ruta:** `/invitations/organization/:organizationId`
- **Autenticación:** ✅ Bearer Token (JWT) + Role Guard
- **Roles Requeridos:** ORG_OWNER
- **Parámetros:**
  - `organizationId` (path) - UUID de la organización
- **Respuesta 200:**
  ```json
  [
    {
      "id": "UUID",
      "email": "string",
      "organizationId": "UUID",
      "status": "PENDING|ACCEPTED",
      "createdAt": "ISO8601"
    }
  ]
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `403 Forbidden`

---

### Endpoint 4: DELETE /invitations/:id
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** DELETE
- **Ruta:** `/invitations/:id`
- **Autenticación:** ✅ Bearer Token (JWT) + Role Guard
- **Roles Requeridos:** ORG_OWNER
- **Parámetros:**
  - `id` (path) - UUID de la invitación
- **Body:** No requerido
- **Respuesta:** 204 No Content
- **Códigos de Estado:**
  - `204 No Content` - Invitación cancelada
  - `403 Forbidden`
  - `404 Not Found`

---

## 🏢 7. ORGANIZATIONS.CONTROLLER.TS ⚠️ SIN SWAGGER

**Decoradores Presentes:** ❌ Ningún decorador @Api*  
**Documentación:** Solo comentarios JSDoc

### Endpoint 1: POST /organizations
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** POST
- **Ruta:** `/organizations`
- **Autenticación:** ✅ Bearer Token (JWT) + Role Guard
- **Roles Requeridos:** PUBLIC_USER
- **Status Code Retornado:** 201 CREATED
- **Body (Required):**
  ```json
  {
    "name": "string",
    "description": "string",
    "website": "string",
    "industry": "string",
    "country": "string"
  }
  ```
- **Respuesta 201:**
  ```json
  {
    "statusCode": 201,
    "message": "Organización creada exitosamente. Usuario promovido a ORG_OWNER.",
    "data": {
      "id": "UUID",
      "name": "string",
      "description": "string",
      "ownerId": "UUID"
    }
  }
  ```
- **Códigos de Estado:**
  - `201 Created`
  - `400 Bad Request` - Datos inválidos
  - `401 Unauthorized`

---

### Endpoint 2: GET /organizations/:id
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** GET
- **Ruta:** `/organizations/:id`
- **Autenticación:** ✅ Bearer Token (JWT) + Role Guard
- **Parámetros:**
  - `id` (path) - UUID de la organización
- **Status Code:** 200 OK
- **Respuesta 200:**
  ```json
  {
    "statusCode": 200,
    "message": "Organización obtenida",
    "data": {
      "id": "UUID",
      "name": "string",
      "description": "string",
      "website": "string",
      "ownerId": "UUID"
    }
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `404 Not Found`

---

### Endpoint 3: GET /organizations
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** GET
- **Ruta:** `/organizations`
- **Autenticación:** ✅ Bearer Token (JWT)
- **Roles Requeridos:** SUPER_ADMIN
- **Parámetros:** Ninguno
- **Respuesta 200:**
  ```json
  {
    "statusCode": 200,
    "message": "Organizaciones obtenidas",
    "data": [
      {
        "id": "UUID",
        "name": "string",
        "description": "string"
      }
    ],
    "count": "number"
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `403 Forbidden` - No es SUPER_ADMIN

---

### Endpoint 4: PATCH /organizations/:id
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** PATCH
- **Ruta:** `/organizations/:id`
- **Autenticación:** ✅ Bearer Token (JWT) + Role Guard
- **Roles Requeridos:** ORG_OWNER, SUPER_ADMIN
- **Parámetros:**
  - `id` (path) - UUID de la organización
- **Body (Parcial):**
  ```json
  {
    "name": "string",
    "description": "string",
    "website": "string",
    "industry": "string"
  }
  ```
- **Respuesta 200:**
  ```json
  {
    "statusCode": 200,
    "message": "Organización actualizada",
    "data": {
      "id": "UUID",
      "name": "string",
      "description": "string",
      "updatedAt": "ISO8601"
    }
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `403 Forbidden`
  - `404 Not Found`

---

### Endpoint 5: GET /organizations/:id/user-count
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** GET
- **Ruta:** `/organizations/:id/user-count`
- **Autenticación:** ✅ Bearer Token (JWT) + Role Guard
- **Parámetros:**
  - `id` (path) - UUID de la organización
- **Status Code:** 200 OK
- **Respuesta 200:**
  ```json
  {
    "statusCode": 200,
    "message": "Cantidad de usuarios obtenida",
    "data": {
      "organizationId": "UUID",
      "userCount": "number"
    }
  }
  ```
- **Códigos de Estado:**
  - `200 OK`
  - `404 Not Found`

---

## 🏠 8. APP.CONTROLLER.TS ❌ SIN DOCUMENTACIÓN

**Decoradores Presentes:** ❌ Ninguno  
**Documentación:** Ninguna

### Endpoint 1: GET /
- **Decoradores Swagger:** ❌ FALTA
- **Método HTTP:** GET
- **Ruta:** `/` (Root)
- **Parámetros:** Ninguno
- **Respuesta 200:**
  ```json
  "string"
  ```
- **Códigos de Estado:** `200 OK`
- **Notas:** Endpoint raíz sin funcionalidad específica

---

## 📊 Resumen de Hallazgos

### ✅ Bien Documentado (71.8%)
1. **auth.controller.ts** (8 endpoints) - Completa
2. **scraping.controller.ts** (5 endpoints) - Completa
3. **health.controller.ts** (3 endpoints) - Básica pero presente
4. **licitaciones.controller.ts** (3 endpoints) - Básica pero presente

### ⚠️ Documentación Incompleta (28.2%)
1. **users.controller.ts** (10 endpoints) - Sin decoradores @Api*
2. **invitations.controller.ts** (4 endpoints) - Sin decoradores @Api*
3. **organizations.controller.ts** (5 endpoints) - Sin decoradores @Api*
4. **app.controller.ts** (1 endpoint) - Sin documentación

---

## 🎯 Acciones Recomendadas (Prioridad)

### 🔴 CRÍTICA
1. **Documentar users.controller.ts** (10 endpoints)
   - Agregar `@ApiTags('Users')`
   - Agregar `@ApiOperation` con descripciones
   - Agregar `@ApiResponse` con códigos de estado
   - Agregar `@ApiBearerAuth` donde sea necesario
   - Documentar DTOs con `@ApiProperty`

2. **Documentar invitations.controller.ts** (4 endpoints)
   - Agregar `@ApiTags('Invitations')`
   - Documentar permisos y validaciones
   - Agregar ejemplos de respuesta

3. **Documentar organizations.controller.ts** (5 endpoints)
   - Agregar `@ApiTags('Organizations')`
   - Documentar respuestas estándar de status/message/data
   - Agregar validaciones de permisos

### 🟡 IMPORTANTE
4. **Expandir documentación de health.controller.ts**
   - Agregar códigos de estado 503 para health checks fallidos
   - Documentar propósito de cada probe

5. **Completar documentación de licitaciones.controller.ts**
   - Agregar `@ApiQuery` para parámetros de filtro
   - Documentar paginación esperada
   - Agregar `@ApiResponse` para errores

### 🟢 OPCIONAL
6. **Documentar app.controller.ts**
   - Definir propósito del endpoint raíz
   - O eliminar si no se usa

---

## 📝 Observaciones Importantes

### Patrones Encontrados
- ✅ **auth.controller.ts** usa un patrón robusto de documentación Swagger
- ⚠️ **users, invitations, organizations** usan JSDoc pero sin decoradores Swagger
- 📌 Respuesta estándar de organizations usa `{statusCode, message, data}`
- 📌 Respuesta de auth usa directamente `{access_token, refresh_token, user}`

### Seguridad
- ✅ Rate limiting en endpoints críticos (login, signup)
- ✅ Brute force protection en auth
- ✅ JWT Bearer token authentication
- ✅ Role-based access control (RBAC) configurado

### Autenticación Requerida
- ❌ `/health/*` - Pública
- ❌ `/auth/login`, `/auth/signup`, `/auth/refresh`, `/auth/google*` - Pública
- ❌ `/licitaciones/*` - Sin especificar (probablemente pública)
- ✅ `/auth/logout`, `/auth/me` - JWT requerido
- ✅ `/users/*` - Probablemente requerida
- ✅ `/invitations` (POST, GET org, DELETE) - JWT + Role requerido
- ✅ `/organizations` - JWT + Role requerido

### Pendientes
- ⚠️ Especificar guard en `GET /users`, `GET /users/organization/:organizationId`
- ⚠️ Especificar guard en `GET /licitaciones` y `GET /licitaciones/filters`
- ⚠️ Documentar DTOs con `@ApiProperty` en todas partes
- ⚠️ Agregar `@ApiUnauthenticatedResponse()` para endpoints públicos

---

**Documento generado:** 17 de abril de 2026
