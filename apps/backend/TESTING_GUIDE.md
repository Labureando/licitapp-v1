# 🧪 Licitapp Testing Guide - Postman

## 📥 Importar Colección

1. Abre **Postman**
2. Click en **Import** (arriba a la izquierda)
3. Selecciona `licitapp-testing.postman_collection.json`
4. ✅ Colección importada

---

## 🔧 Variables de Entorno

La colección usa variables globales que se autorellenan:

| Variable | Descripción | Se establece en |
|----------|------------|-----------------|
| `baseUrl` | `http://localhost:3000` | Inicial |
| `apiPrefix` | `/api` | Inicial |
| `access_token` | JWT token de usuario | Login |
| `refresh_token` | Token de refresco | Login |
| `user_id` | ID del usuario logueado | Login |
| `org_id` | ID de organización creada | Create Organization |
| `tag_id` | ID de tag creada | Create Tag |
| `alert_id` | ID de alerta creada | Create Alert |

---

## 🔄 Flujo de Testing Recomendado

### **Phase 1: Autenticación**
```
1. Health Check (verificar servidor)
2. Signup Step 1 (crear cuenta con email, firstName, lastName) → obtiene signup_token
3. Signup Step 2 (establecer password con el token) → obtiene access_token
4. Get Current User (me)
```

**Nota:** El signup es de 2 pasos:
- Paso 1: Registra email y datos básicos, devuelve token
- Paso 2: Usa token para establecer password

**Esperar después de cada paso** para que se establezcan las variables.

### **Phase 2: Organizaciones**
```
1. Create Organization (crea org, establece {{org_id}})
2. Get Organization (verificar que existe)
3. Get User Count (verificar auditoría)
4. Update Organization (probar PATCH con auditoría)
```

### **Phase 3: Tags**
```
1. Create Private Tag (crea tag privada, establece {{tag_id}})
2. Get My Tags (listar todas las suyas)
3. Subscribe to Global Tag (probar suscripción)
4. Pin Tag (probar operación con auditoría)
5. Unsubscribe from Tag (probar DELETE con auditoría)
6. Get Global Tags (endpoint público)
```

### **Phase 4: Alerts**
```
1. Create Alert (crea alerta, establece {{alert_id}})
2. Get All Alerts (listar alertas)
3. Get Alert (obtener detalle)
4. Update Alert (probar PATCH con auditoría)
5. Delete Alert (probar DELETE con auditoría y validación)
```

### **Phase 5: Users**
```
1. Get Current User Profile (GET /:userId con validación)
2. Update User Profile (PATCH con ownership)
3. Change Password (con auditoría)
```

### **Phase 6: Licitaciones (Public)**
```
1. Search Licitaciones (búsqueda pública)
2. Get Licitacion Filters (opciones públicas)
```

### **Phase 7: Authorization Tests (Negativas)**
```
1. Try to Access Without Token (sin autorización)
2. Try to Update Someone Else's Alert (validar ownership)
3. Try to Delete Non-Existent Resource (validar existencia)
```

---

## ✅ Validaciones a Verificar

### **Autenticación & JWT**
- ✅ Login devuelve `access_token` válido
- ✅ Token se autoestablece en `Authorization: Bearer {{access_token}}`
- ✅ `/me` devuelve datos del usuario autenticado
- ✅ Request sin token → **401 Unauthorized**

### **Ownership & Permisos**
- ✅ Usuario solo puede modificar su propia organización
- ✅ Usuario solo puede modificar sus propias alertas
- ✅ Usuario no puede eliminar recurso ajeno → **403 Forbidden**

### **Validación de Recursos**
- ✅ GET /:id con ID inexistente → **404 Not Found**
- ✅ DELETE /:id valida existencia antes de eliminar
- ✅ Soft delete marca como eliminado pero no borra

### **Auditoría**
- ✅ LogAuditAction('ALERT_CREATE') registra creación
- ✅ LogAuditAction('ALERT_UPDATE') registra actualización
- ✅ LogAuditAction('ALERT_DELETE') registra eliminación
- ✅ Cada operación incluye userId, timestamp, IP, userAgent

### **Rate Limiting**
- ✅ POST `/auth/login` limitado a 5 intentos/15 min
- ✅ Después de límite → **429 Too Many Requests**

---

## 🔍 Cómo Ver Respuestas

### **En Postman:**
1. Haz click en una request
2. Click en **Send**
3. Verifica la pestaña **Body** (respuesta)
4. La pestaña **Tests** muestra validaciones automáticas

### **Respuesta Exitosa (200/201):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { /* datos */ }
}
```

### **Error (4xx/5xx):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized - No token provided",
  "error": "Unauthorized"
}
```

---

## 🐛 Troubleshooting

### Problem: "Token not set"
**Solución:** Verifica que ejecutaste **Login** primero y esperar 1 segundo

### Problem: "404 Not Found" en alerts/{{alert_id}}
**Solución:** Verifica que ejecutaste **Create Alert** primero

### Problem: "Ownership validation failed"
**Solución:** No puedes modificar recursos de otros usuarios (correcto!)

### Problem: "Database connection error"
**Solución:** Verifica que el servidor está corriendo: `npm run start:dev`

---

## 📊 Script de Test Automático

Para ejecutar toda la colección automáticamente:

1. Click derecho en la colección → **Run collection**
2. Configura:
   - Iterations: 1
   - Delay between requests: 500ms
3. Click **Run**

El runner ejecutará todos los tests en orden y mostrará:
- ✅ Passou
- ❌ Falhou
- ⚠️ Skipped

---

## 📈 Métricas a Validar

Después de completar todos los tests, verifica:

| Métrica | Esperado | Cómo verificar |
|---------|----------|----------------|
| Usuarios creados | 1+ | Database: `SELECT COUNT(*) FROM users` |
| Organizaciones | 1+ | Database: `SELECT COUNT(*) FROM organizations` |
| Alertas | 1+ | GET /alerts (debería listar) |
| Auditoría | 5+ registros | Database: `SELECT COUNT(*) FROM audit_logs` |
| Tokens válidos | Presente | Authorization header en requests |
| Rate limit | Funciona | POST /login 6 veces → 429 |

---

## 🚀 Próximos Pasos

1. ✅ **Ejecutar testing manual** (este guide)
2. ✅ **Verificar auditoría** en database
3. ⏳ **Automatizar tests** con CI/CD
4. ⏳ **Test load** con Artillery o K6
5. ⏳ **Security scan** con OWASP ZAP

---

## 💡 Tips Adicionales

- **Pre-request Script:** Autentifica antes de cada request
- **Test Script:** Valida respuestas automáticamente
- **Variables de entorno:** Permite cambiar entre dev/test/prod
- **Collections Linking:** Puedes ejecutar collections en secuencia

---

¡Listo para empezar testing! 🎉
