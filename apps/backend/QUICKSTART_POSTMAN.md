# ⚡ QUICKSTART - Colección Postman LicitApp

**Tiempo estimado:** 5 minutos para comenzar a testear  
**Requisitos:** Postman instalado + servidor backend corriendo en `http://localhost:3000`

---

## 🚀 5 Pasos para Comenzar

### 1️⃣ Importar Colección
```
Postman → Import → licitapp-complete-collection.postman_collection.json
```

### 2️⃣ Verificar Servidor
```
Ejecutar: GET /health
Esperado: { "status": "OK" }
```

### 3️⃣ Crear Cuenta (2 pasos)
**Paso A:**
```
POST /auth/signup
Body: {
  "email": "tu-email@example.com",
  "firstName": "Tu",
  "lastName": "Nombre"
}
```
✅ Recibirás email con token

**Paso B:**
```
POST /auth/complete-signup/[TOKEN_DEL_EMAIL]
Body: {
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```
✅ `access_token` y `refresh_token` se guardan automáticamente

### 4️⃣ Probar Otros Endpoints
```
GET /auth/me          → Ves tu perfil
POST /organizations   → Creas organización
POST /alerts          → Creas alerta
```

### 5️⃣ ¡Listo!
Todos los endpoints están funcionales. Ve a [POSTMAN_COLLECTION_GUIDE.md](POSTMAN_COLLECTION_GUIDE.md) para guía completa.

---

## 🔥 Flujos Rápidos

### ✨ Flujo: Crear Alerta Personalizada
```
1. POST /auth/login                    (obtener tokens)
2. POST /organizations                 (crear org)
3. POST /tags/private                  (crear etiqueta privada)
4. POST /tags/:id/subscribe            (suscribirse a global)
5. POST /alerts                        (crear alerta)
```

### ✨ Flujo: Invitar Usuario a Organización
```
1. POST /auth/login                    (como admin)
2. POST /organizations                 (crear org si no existe)
3. POST /invitations                   (invitar usuario)
4. [Usuario recibe email]
5. POST /invitations/:token/accept     (usuario acepta)
```

### ✨ Flujo: Buscar Licitaciones
```
1. GET /licitaciones/filters           (ver opciones filtro)
2. GET /licitaciones?search=X          (buscar)
3. GET /licitaciones/:id               (ver detalles)
```

---

## 📊 Estructura de Variables

| Variable | Uso | Ejemplo |
|----------|-----|---------|
| `{{baseUrl}}` | URL del servidor | `http://localhost:3000` |
| `{{access_token}}` | Auth header | `Bearer eyJhbGc...` |
| `{{userId}}` | User ID | `f47ac10b-58cc-4372...` |
| `{{organizationId}}` | Org ID | `550e8400-e29b-41d4...` |
| `{{tagId}}` | Tag ID | `6ba7b810-9dad-11d1...` |
| `{{alertId}}` | Alert ID | `6ba7b811-9dad-11d1...` |

**Cómo usarlas:**
```
URL: {{baseUrl}}/api/v1/users/{{userId}}
Header: Authorization: Bearer {{access_token}}
```

---

## 🛠️ Editar baseUrl

**Si servidor corre en otro puerto:**

1. Click en **Environment** (esquina superior derecha)
2. Click en **Edit** junto a "Environment" activo
3. Edita `baseUrl` a tu URL
4. Save

Ejemplo:
```
baseUrl = http://192.168.1.100:3000
baseUrl = https://api.prod.licitapp.com
```

---

## ❓ Problemas Comunes

### "No token provided"
→ Ejecuta primero `POST /auth/login` o `/auth/complete-signup`

### "Rate limit exceeded (429)"
→ Espera 15 minutos. Límite: 5 intentos por endpoint sensible

### "Email already registered"
→ Usa otro email o limpia base de datos: `npm run db:reset`

### "Unauthorized (401)"
→ Token expiró. Ejecuta `POST /auth/refresh`

---

## 📈 Endpoints por Área

### 🔐 Auth (sin token requerido)
```
POST   /auth/signup
POST   /auth/complete-signup/:token
POST   /auth/login
POST   /auth/refresh
GET    /auth/google
GET    /auth/google/callback
```

### 👥 Users (requiere token)
```
GET    /users
GET    /users/:userId
PATCH  /users/:userId
POST   /users/:userId/deactivate
POST   /users/:userId/activate
```

### 🏷️ Tags (requiere token)
```
GET    /tags/global
POST   /tags/private
GET    /tags/my/all
POST   /tags/:id/subscribe
DELETE /tags/:id/unsubscribe
PATCH  /tags/:id/pin
```

### 🚨 Alerts (requiere token)
```
POST   /alerts
GET    /alerts
GET    /alerts/:id
PATCH  /alerts/:id
DELETE /alerts/:id
```

### 📋 Licitaciones (público)
```
GET    /licitaciones
GET    /licitaciones/filters
GET    /licitaciones/:id
```

---

## ✅ Testing con Postman

**Para ejecutar todos los tests:**
1. Selecciona la colección `LicitApp - Colección Completa`
2. Click en **Run** (arriba a la derecha)
3. Selecciona ambiente
4. Click **Start Run**

**Resultado esperado:** ✅ Todos en verde

---

## 🔑 Flujo OAuth Google

⚠️ **Nota:** Para testing local, usa email/contraseña. OAuth requiere:
- Client ID registrado en Google
- Redirect URI configurado
- HTTPS en producción

Para habilitar:
1. Obtén credentials en Google Cloud Console
2. Agrega a `.env`: `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
3. Reinicia servidor
4. Usa `GET /auth/google`

---

## 📞 Support

Para errores o preguntas:
1. Revisa [POSTMAN_COLLECTION_GUIDE.md](POSTMAN_COLLECTION_GUIDE.md)
2. Consulta logs del servidor: `npm run start:dev`
3. Verifica Swagger: `http://localhost:3000/api/docs`

---

## 🎯 Checklist Inicial

- [ ] Postman instalado
- [ ] Colección importada
- [ ] `GET /health` retorna 200 OK
- [ ] `POST /auth/signup` funciona
- [ ] Email recibido con token
- [ ] `POST /auth/complete-signup` retorna tokens
- [ ] `GET /auth/me` muestra tu perfil
- [ ] Variables se llenan automáticamente

---

**¡Listo para usar!** 🎉

Próximo paso → Lee [POSTMAN_COLLECTION_GUIDE.md](POSTMAN_COLLECTION_GUIDE.md) para guía completa
