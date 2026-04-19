# 📊 Auditoría - Guía de Verificación

## Introducción

Con los guards implementados (especialmente `@LogAuditAction`), cada operación se registra automáticamente. Esta guía explica cómo verificar que la auditoría funciona correctamente.

---

## 📍 Tabla de Auditoría

```sql
-- Estructura de la tabla (pendiente de crear)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  action VARCHAR(255), -- 'CREATE', 'UPDATE', 'DELETE', 'ALERT_CREATE', 'TAG_UPDATE', etc.
  entity VARCHAR(255), -- 'Alert', 'Organization', 'Tag', etc.
  entityId UUID,
  method VARCHAR(10), -- 'GET', 'POST', 'PATCH', 'DELETE'
  path VARCHAR(500),
  statusCode INT,
  ipAddress VARCHAR(50),
  userAgent TEXT,
  changes JSONB, -- Cambios realizados
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔍 Verificar Auditoría

### Opción 1: Via PostgreSQL (Recomendado)

```bash
# Conectar a la BD
psql -U postgres -d licitapp

# Ver últimos 10 registros de auditoría
SELECT id, "userId", action, method, path, "statusCode", "ipAddress", "createdAt"
FROM audit_log
ORDER BY "createdAt" DESC
LIMIT 10;

# Ver auditoría de un usuario específico
SELECT * FROM audit_log
WHERE "userId" = 'YOUR_USER_ID'
ORDER BY "createdAt" DESC;

# Ver auditoría por acción
SELECT action, COUNT(*) as total
FROM audit_log
GROUP BY action
ORDER BY total DESC;

# Ver auditoría en un rango de tiempo
SELECT * FROM audit_log
WHERE "createdAt" >= NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;
```

### Opción 2: Via Postman (En desarrollo)

Cuando implementes el endpoint de auditoría:

```
GET /api/audit-logs
GET /api/audit-logs?userId=UUID
GET /api/audit-logs?action=ALERT_CREATE
GET /api/audit-logs?dateFrom=2026-04-19&dateTo=2026-04-20
```

### Opción 3: Via Swagger/OpenAPI

1. Abre http://localhost:3000/api/docs
2. Busca el endpoint `GET /audit-logs`
3. Click en **Try it out**
4. Verifica los logs

---

## ✅ Checklist de Auditoría

### Phase 1: Setup
- [ ] Tabla `audit_log` creada en PostgreSQL
- [ ] Columnas: id, userId, action, entity, entityId, method, path, statusCode, ipAddress, userAgent, changes, createdAt
- [ ] Índices en userId, action, createdAt (para búsquedas rápidas)

### Phase 2: Testing Manual
- [ ] Crear Alert → Verifica registro de ALERT_CREATE
- [ ] Actualizar Alert → Verifica registro de ALERT_UPDATE
- [ ] Eliminar Alert → Verifica registro de ALERT_DELETE
- [ ] Crear Organización → Verifica registro de ORG_CREATE
- [ ] Actualizar Perfil de Usuario → Verifica registro de USER_UPDATE
- [ ] Cambiar Contraseña → Verifica registro de PASSWORD_CHANGE

### Phase 3: Validación
- [ ] userId correcto en cada registro
- [ ] method correcto (POST, PATCH, DELETE, etc.)
- [ ] path correcto (GET /api/alerts/123)
- [ ] statusCode correcto (201 para CREATE, 200 para UPDATE)
- [ ] ipAddress capturado
- [ ] userAgent capturado
- [ ] createdAt con timestamp correcto

### Phase 4: Compliance
- [ ] Auditoría de más de 30 días
- [ ] Auditoría no puede ser modificada (append-only)
- [ ] Acceso a auditoría solo para SUPER_ADMIN
- [ ] Exportación de auditoría a formato legal (CSV, PDF)

---

## 🎯 Registros Esperados por Endpoint

### Authentication
```
Action: AUTH_LOGIN
Entity: User
statusCode: 200
```

### Alerts
```
Action: ALERT_CREATE → statusCode: 201
Action: ALERT_UPDATE → statusCode: 200
Action: ALERT_DELETE → statusCode: 204
```

### Organizations
```
Action: ORG_CREATE → statusCode: 201
Action: ORG_UPDATE → statusCode: 200
```

### Tags
```
Action: TAG_CREATE → statusCode: 201
Action: TAG_DELETE → statusCode: 204
Action: TAG_SUBSCRIBE → statusCode: 200
Action: TAG_UNSUBSCRIBE → statusCode: 204
```

### Users
```
Action: USER_UPDATE → statusCode: 200
Action: USER_DELETE → statusCode: 204
Action: PASSWORD_CHANGE → statusCode: 200
```

### Scraping (Admin)
```
Action: SCRAPING_RUN → statusCode: 202
Action: MIGRATION_SEARCH_VECTOR → statusCode: 200
Action: MIGRATION_SEARCH_TRIGGER → statusCode: 200
```

---

## 📝 Ejemplo de Registro de Auditoría

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "action": "ALERT_CREATE",
  "entity": "Alert",
  "entityId": "667e8400-e29b-41d4-a716-446655440001",
  "method": "POST",
  "path": "/api/alerts",
  "statusCode": 201,
  "ipAddress": "127.0.0.1",
  "userAgent": "PostmanRuntime/7.32.3",
  "changes": {
    "nombre": "Test Alert",
    "descripcion": "Alert for testing",
    "criterios": {
      "tipoContrato": ["SERVICIOS"],
      "estado": ["ABIERTA"]
    }
  },
  "createdAt": "2026-04-19T10:30:45.123Z"
}
```

---

## 🔐 Queries Útiles para Compliance

### Auditoría de Cambios por Usuario
```sql
SELECT 
  "userId",
  COUNT(*) as total_actions,
  MIN("createdAt") as first_action,
  MAX("createdAt") as last_action
FROM audit_log
GROUP BY "userId"
ORDER BY total_actions DESC;
```

### Auditoría de Eliminaciones
```sql
SELECT * FROM audit_log
WHERE action LIKE '%DELETE%'
ORDER BY "createdAt" DESC;
```

### Auditoría de Intentos Fallidos
```sql
SELECT * FROM audit_log
WHERE "statusCode" >= 400
ORDER BY "createdAt" DESC;
```

### Auditoría Masiva (Potencialmente Fraudulenta)
```sql
SELECT 
  "userId",
  action,
  COUNT(*) as count,
  MIN("createdAt") as earliest,
  MAX("createdAt") as latest
FROM audit_log
WHERE "createdAt" >= NOW() - INTERVAL '1 day'
GROUP BY "userId", action
HAVING COUNT(*) > 50
ORDER BY count DESC;
```

---

## 🚀 Próximos Pasos

### Implementación Pendiente
1. **Crear tabla audit_log** en PostgreSQL
2. **Implementar AuditInterceptor** para persister audit_log
3. **Crear endpoint GET /audit-logs** (admin only)
4. **Agregar filtrado** por userId, action, dateRange
5. **Agregar exportación** a CSV/PDF
6. **Agregar alertas** para acciones sospechosas
7. **Implementar retención** (borrar auditoría > 90 días)

### Migración de Base de Datos
```bash
# Generar migración
npm run migration:generate -- add_audit_log_table

# Ejecutar migración
npm run migration:run
```

---

## 📊 Dashboard de Auditoría (Futuro)

Considerar agregar:
- Gráficos de actividad por usuario
- Línea de tiempo de cambios
- Alertas en tiempo real de acciones sospechosas
- Reportes mensuales de compliance
- Exportación automática a auditor externo

---

## ✅ Validación Post-Testing

Después de ejecutar todos los tests en Postman:

```bash
# Contar registros de auditoría
psql -U postgres -d licitapp -c "SELECT COUNT(*) FROM audit_log;"

# Ver acciones más comunes
psql -U postgres -d licitapp -c \
  "SELECT action, COUNT(*) FROM audit_log GROUP BY action ORDER BY COUNT(*) DESC;"

# Verificar que todos los usuarios tienen auditoría
psql -U postgres -d licitapp -c \
  "SELECT DISTINCT \"userId\" FROM audit_log ORDER BY \"userId\";"
```

---

Esto completa el sistema de auditoría. 🎉
