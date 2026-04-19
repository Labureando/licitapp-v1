# 📚 Guía de Uso - Colección Postman LicitApp Completa

**Versión:** 1.0  
**Fecha:** 19 de abril de 2026  
**Total de Endpoints:** 60+  

---

## 📦 Contenido de la Colección

La colección incluye 60 endpoints HTTP organizados en 9 categorías:

| Categoría | Endpoints | Descripción |
|-----------|-----------|-------------|
| 🔐 **Authentication** | 8 | Login, signup (2-step), refresh, logout, Google OAuth |
| 👥 **Users** | 10 | CRUD usuarios, cambio contraseña, recuperación |
| 🏢 **Organizations** | 5 | CRUD organizaciones, gestión de miembros |
| 🏷️ **Tags** | 16 | Etiquetas globales/privadas, suscripciones, promoción |
| 🚨 **Alerts** | 5 | CRUD alertas personalizadas |
| 📧 **Invitations** | 4 | Invitaciones a organizaciones |
| 📋 **Licitaciones** | 3 | Búsqueda pública de licitaciones |
| 🔄 **Scraping** | 5 | Control de scraping de datos |
| ❤️ **Health** | 3 | Health checks del servidor |

**Total: 59 endpoints**

---

## 🚀 Instalación

### Paso 1: Descargar
```bash
# El archivo ya está en el workspace:
licitapp-complete-collection.postman_collection.json
```

### Paso 2: Importar en Postman
1. Abre **Postman** → Click en **Import** (esquina superior izquierda)
2. Selecciona el archivo `licitapp-complete-collection.postman_collection.json`
3. ✅ Colección importada correctamente

### Paso 3: Configurar Variables
La colección crea automáticamente variables globales:

| Variable | Descripción | Se establece en |
|----------|------------|-----------------|
| `baseUrl` | `http://localhost:3000` | Manual (editar) |
| `access_token` | JWT auth token | POST /auth/login |
| `refresh_token` | Token de refresco | POST /auth/login |
| `userId` | ID usuario autenticado | POST /auth/login |
| `organizationId` | ID organización creada | POST /organizations |
| `tagId` | ID etiqueta creada | POST /tags/private |
| `alertId` | ID alerta creada | POST /alerts |
| `invitationId` | ID invitación creada | POST /invitations |

---

## 🔄 Flujo de Testing Recomendado

### **FASE 1: Autenticación (Inicial)**
```
1. ✅ GET /health                    (verificar servidor activo)
2. ✅ POST /auth/signup              (crear cuenta - STEP 1)
3. ⚠️ OBTENER token del email        (token enviado por correo)
4. ✅ POST /auth/complete-signup     (completar registro - STEP 2)
5. ✅ GET /auth/me                   (verificar perfil)
```

**Variables establecidas:**
- ✅ `access_token` (del paso 4)
- ✅ `refresh_token` (del paso 4)
- ✅ `userId` (del paso 4)

---

### **FASE 2: Organizaciones**
```
1. ✅ POST /organizations            (crear organización)
2. ✅ GET /organizations/:id         (obtener detalles)
3. ✅ PATCH /organizations/:id       (actualizar)
4. ✅ GET /organizations/:id/user-count  (ver miembros)
```

**Variables establecidas:**
- ✅ `organizationId` (del paso 1)

---

### **FASE 3: Etiquetas**
```
1. ✅ GET /tags/global              (ver marketplace)
2. ✅ POST /tags/private            (crear etiqueta privada)
3. ✅ GET /tags/my/all              (mis etiquetas)
4. ✅ POST /tags/:id/subscribe      (suscribirse a global)
5. ✅ PATCH /tags/:id/pin           (fijar en dashboard)
6. ✅ POST /tags/:id/vote-to-global (votar por promoción)
```

**Variables establecidas:**
- ✅ `tagId` (del paso 2)

---

### **FASE 4: Alertas**
```
1. ✅ POST /alerts                  (crear alerta)
2. ✅ GET /alerts                   (listar alertas)
3. ✅ GET /alerts/:id               (obtener detalle)
4. ✅ PATCH /alerts/:id             (actualizar)
5. ✅ DELETE /alerts/:id            (eliminar)
```

**Variables establecidas:**
- ✅ `alertId` (del paso 1)

---

### **FASE 5: Invitaciones**
```
1. ✅ POST /invitations             (invitar usuario)
2. ✅ GET /invitations/organization/:id  (listar invitaciones)
3. ⚠️ POST /invitations/:token/accept    (aceptar invitación)
4. ✅ DELETE /invitations/:id       (cancelar invitación)
```

**Variables establecidas:**
- ✅ `invitationId` (del paso 1)

---

### **FASE 6: Búsqueda (Público)**
```
1. ✅ GET /licitaciones/filters     (ver opciones de filtro)
2. ✅ GET /licitaciones             (buscar licitaciones)
3. ✅ GET /licitaciones/:id         (obtener detalle)
```

---

### **FASE 7: Scraping (Admin)**
```
1. ✅ GET /scraping/stats           (ver estadísticas)
2. ✅ POST /scraping/place/run      (iniciar scraping)
3. ✅ POST /scraping/place/historical/:period  (cargar histórico)
```

---

## 🔐 Seguridad & Autenticación

### Pre-request Script
Todos los endpoints autenticados incluyen pre-request script que:
- ✅ Valida que `access_token` esté establecido
- ✅ Agrega header `Authorization: Bearer {{access_token}}`

### Rate Limiting
**Endpoints con límite:**
- POST /auth/login → 5 requests/15 min
- POST /auth/signup → 5 requests/15 min
- POST /auth/complete-signup → 5 requests/15 min

**Respuesta al exceder límite:**
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Rate limit exceeded"
}
```

---

## ✅ Tests Automatizados

Cada request incluye tests que validar:

### Tests Estándar
```javascript
// Validar status code
pm.test('Status is 200 OK', function () {
    pm.response.to.have.status(200);
});

// Capturar tokens automáticamente
pm.test('Has access_token', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.access_token).to.be.a('string');
    pm.environment.set('access_token', jsonData.access_token);
});
```

### Ejemplos por Tipo
| Tipo | Valida | Ejemplo |
|------|--------|---------|
| **GET** | Status 200, array/objeto | Estructura de datos |
| **POST** | Status 201, ID generado | Nuevo recurso |
| **PATCH** | Status 200, datos actualizados | Cambios aplicados |
| **DELETE** | Status 204, sin contenido | Eliminación confirmada |

---

## 🔍 Payloads por Endpoint

### Authentication
```json
// POST /auth/signup
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}

// POST /auth/complete-signup/:token
{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}

// POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// POST /auth/refresh
{
  "refresh_token": "{{refresh_token}}"
}
```

### Users
```json
// PATCH /users/:userId
{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+1234567890"
}

// PATCH /users/password/change
{
  "oldPassword": "CurrentPass123!",
  "newPassword": "NewPass456!"
}
```

### Organizations
```json
// POST /organizations
{
  "name": "My Company",
  "description": "Company description",
  "website": "https://company.com",
  "industry": "Technology",
  "country": "ES"
}

// PATCH /organizations/:id
{
  "name": "Updated Name",
  "description": "Updated desc",
  "website": "https://newsite.com"
}
```

### Tags
```json
// POST /tags/global (solo admin)
{
  "name": "Construction",
  "slug": "construction",
  "description": "Desc",
  "category": "infrastructure",
  "keywords": "build,civil"
}

// POST /tags/private
{
  "name": "My Tag",
  "description": "My personal tag"
}

// PATCH /tags/:id
{
  "name": "Updated",
  "description": "Updated desc"
}
```

### Alerts
```json
// POST /alerts
{
  "name": "My Alert",
  "email": "alerts@example.com",
  "keywords": "construction",
  "estado": "ABIERTA",
  "importe": 5000
}

// PATCH /alerts/:id
{
  "name": "Updated Alert",
  "keywords": "updated"
}
```

### Invitations
```json
// POST /invitations
{
  "email": "newuser@example.com",
  "organizationId": "{{organizationId}}",
  "role": "ORG_MEMBER"
}
```

---

## 🚨 Códigos de Error Comunes

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Email already registered",
  "error": "Bad Request"
}
```
**Causas:** Validación fallida, datos duplicados, formato incorrecto

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized - No token provided",
  "error": "Unauthorized"
}
```
**Causas:** Token faltante, expirado o inválido

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```
**Causas:** Usuario no tiene permisos (RBAC), ownership validation fallida

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```
**Causas:** ID no existe, recurso eliminado

### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests"
}
```
**Causas:** Rate limit o brute force protection activado

---

## 📝 Notas Importantes

### Paso 2 del Signup (Crítico)
El endpoint `/auth/complete-signup/:token` requiere el token enviado por email:
1. **Ejecutar** `POST /auth/signup` con email
2. **Verificar** correo electrónico (normalmente en spam)
3. **Copiar** token del link/email
4. **Reemplazar** `REPLACE_WITH_SIGNUP_TOKEN` en la URL del paso 2
5. **Ejecutar** `POST /auth/complete-signup/:token`

### Variables Globales
- Las variables se establecen **automáticamente** después de cada request exitoso
- Se guardan en **Postman Environment** por defecto
- Pueden editarse manualmente en **Manage Environments**

### Google OAuth
- Los endpoints `/auth/google` y `/auth/google/callback` requieren configuración OAuth
- En desarrollo local, usar email/contraseña es más simple

### Validación de Ownership
Algunos endpoints validan que solo el propietario pueda actuar:
- `PATCH /users/:userId` - Solo el usuario o admin
- `PATCH /alerts/:id` - Solo el propietario
- `DELETE /tags/:id` - Solo propietario o admin

---

## 🧪 Testing Checklist

Después de importar, verifica:

- [ ] Variables globales se establecen correctamente
- [ ] Tests en verde ✅ después de cada request
- [ ] Tokens se capturan automáticamente
- [ ] IDs de recursos se guardan en variables
- [ ] Errores 401 sin token
- [ ] Errores 403 sin permisos
- [ ] Errores 404 con IDs inválidos
- [ ] Rate limiting funciona (429 después de 5 intentos)

---

## 🔗 Endpoints por Rol

### PUBLIC_USER
- ✅ GET /health*
- ✅ GET /auth/google, /auth/google/callback
- ✅ GET /licitaciones*
- ✅ GET /licitaciones/filters
- ✅ POST /auth/signup, /auth/login, /auth/refresh
- ⚠️ POST /organizations (se promueve a ORG_OWNER)

### ORG_MEMBER
- ✅ Todos PUBLIC_USER
- ✅ GET /tags/my/*
- ✅ POST/PATCH/DELETE /alerts (solo suyos)
- ✅ POST /tags/private

### ORG_OWNER
- ✅ Todos ORG_MEMBER
- ✅ POST /invitations
- ✅ PATCH /organizations/:id
- ✅ GET /organizations/:id/user-count

### SUPER_ADMIN
- ✅ Todos los endpoints (sin restricción)
- ✅ POST /tags/global
- ✅ GET /organizations (listar todas)
- ✅ POST /scraping/*

---

## 📞 Troubleshooting

### "Invalid token" en requests autenticados
1. Verifica que ejecutaste login primero
2. Mira en **Environment Variables** que `access_token` no esté vacío
3. Si expiró (1h), usa `POST /auth/refresh`

### "Rate limit exceeded" (429)
1. Espera 15 minutos o
2. Cambia el `baseUrl` en Environment
3. Usa otra IP si es posible

### Email de signup no llega
1. Revisa **spam/junk folders**
2. Verifica que el email sea válido
3. Comprueba que el servidor SMTP esté configurado

### Validar que servidor está corriendo
```bash
curl http://localhost:3000/api/v1/health
# Debería retornar: {"status":"OK","timestamp":"..."}
```

---

## 📚 Recursos Adicionales

- **Documentación Swagger:** http://localhost:3000/api/docs
- **OpenAPI JSON:** http://localhost:3000/api-json
- **Archivo:** TESTING_GUIDE.md
- **Audit:** ENDPOINTS_AUDIT.md

---

**Última actualización:** 19 de abril de 2026
