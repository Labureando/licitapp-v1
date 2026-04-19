# 📮 LICITAPP - Postman Testing Guide

## ✅ Quick Start (5 minutes)

### 1. Import Collection
- Open **Postman**
- Click **Import** → Select `licitapp-complete.postman_collection.json`
- Collection "LICITAPP - API Testing Suite" appears in left panel

### 2. Set Base URL
- Click **Variables** tab at top
- Set `baseUrl` = `http://localhost:3000`
- Click **Save**

### 3. Run Complete Flow
Execute requests in this order:
1. ❤️ **Health - General Check** (verify server is running)
2. 🔐 **Auth - Signup Step 1** (get `signup_token`)
3. 🔐 **Auth - Signup Step 2** (use `{{signup_token}}`, get `access_token`)
4. 🏢 **Organizations - Create** (get new `access_token` with ORG_OWNER role)
5. 🏷️ **Tags - Create Global** (admin endpoint)
6. 🚨 **Alerts - Create** (use latest `access_token`)

---

## 📋 API Endpoints Summary

| Category | Count | Endpoints |
|----------|-------|-----------|
| ❤️ **Health** | 3 | Status, Readiness, Liveness |
| 🔐 **Authentication** | 6 | Signup, Login, Logout, Refresh, Me |
| 🏢 **Organizations** | 5 | CRUD + User Count |
| 👥 **Users** | 10 | CRUD, Password, Deactivate/Activate |
| 🏷️ **Tags** | 14 | Global/Private, Subscribe, Vote, Promote |
| 🚨 **Alerts** | 5 | CRUD |
| 📧 **Invitations** | 4 | Send, Accept, List, Cancel |
| 📋 **Licitaciones** | 3 | Search, Filters, Detail |
| 🔄 **Scraping** | 6 | Run, Historical, Stats |

**Total: 56 endpoints**

---

## 🔑 Important Variables

These are **automatically captured** after successful responses:

```
access_token     - JWT token for authenticated requests
refresh_token    - Token to refresh access_token
signup_token     - Token from signup step 1
organizationId   - Organization ID from creation
userId           - User ID (from auth/me)
tagId            - Tag ID from creation
alertId          - Alert ID from creation
invitationId     - Invitation ID
```

---

## 🚀 Complete Testing Flow

### Phase 1: Setup User Account
```
1. POST /health                      ✅ Verify server
2. POST /auth/signup                 ✅ Email registration (get signup_token)
3. POST /auth/complete-signup/{token} ✅ Set password (get access_token)
4. GET /auth/me                      ✅ Verify account
```

### Phase 2: Create Organization
```
5. POST /organizations               ✅ Create org (get new access_token)
6. GET /organizations/{id}           ✅ Retrieve org
7. PATCH /organizations/{id}         ✅ Update org
```

### Phase 3: Manage Tags
```
8. POST /tags/global                 ✅ Create global tag (admin only)
9. GET /tags/global                  ✅ List global tags
10. POST /tags/private               ✅ Create private tag
11. POST /tags/{id}/subscribe        ✅ Subscribe to global tag
12. PATCH /tags/{id}/pin             ✅ Pin tag to dashboard
```

### Phase 4: Manage Alerts
```
13. POST /alerts                     ✅ Create alert
14. GET /alerts                      ✅ List alerts
15. GET /alerts/{id}                 ✅ Get alert details
16. PATCH /alerts/{id}               ✅ Update alert
```

### Phase 5: Manage Users
```
17. GET /users                       ✅ List all users (admin)
18. GET /users/{id}                  ✅ Get user
19. PATCH /users/{id}                ✅ Update user
20. PATCH /users/password/change     ✅ Change password
```

### Phase 6: Invitations & Access Control
```
21. POST /invitations                ✅ Send invitation
22. GET /invitations/organization/{id} ✅ List org invitations
23. POST /invitations/{token}/accept ✅ Accept invitation
```

---

## 🔐 Authentication Flow

### Login with Email/Password
```bash
# 1. Signup (2 steps)
POST /auth/signup
Body: { email, firstName, lastName, phone, timezone }
Response: { message, signup_token }

# 2. Complete signup
POST /auth/complete-signup/{signup_token}
Body: { password, passwordConfirm }
Response: { access_token, refresh_token, user }

# 3. Use token in all protected endpoints
Header: Authorization: Bearer {{access_token}}
```

### Refresh Token
```bash
POST /auth/refresh
Body: { refresh_token: "{{refresh_token}}" }
Response: { access_token, refresh_token }
```

### Logout
```bash
POST /auth/logout
Header: Authorization: Bearer {{access_token}}
```

---

## 👤 User Roles & Permissions

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **SUPER_ADMIN** | Everything | Nothing (god mode) |
| **ORG_OWNER** | Manage org, invite users | Create global tags |
| **ORG_MEMBER** | Read org data, create alerts | Modify org settings |
| **PUBLIC_USER** | Create org, personal alerts | Access org features |

---

## 📝 Example Payloads

### Signup Step 1
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+34912345678"
}
```

### Signup Step 2
```json
{
  "password": "SecurePassword123!",
  "passwordConfirm": "SecurePassword123!"
}
```

### Create Organization
```json
{
  "name": "My Company",
  "description": "A description",
  "phone": "+34912345678",
  "website": "https://example.com"
}
```

### Create Alert
```json
{
  "name": "Services Alert",
  "description": "Watch for services contracts",
  "estados": ["ABIERTA"],
  "tiposContrato": ["SERVICIO"],
  "procedimientos": ["ABIERTO"],
  "ccaas": ["Cataluña"]
}
```

### Create Global Tag (Admin)
```json
{
  "name": "Infrastructure",
  "slug": "infrastructure",
  "description": "Infrastructure services",
  "category": "services"
}
```

### Create Private Tag
```json
{
  "name": "My Important Tag",
  "description": "For personal use"
}
```

---

## 🧪 Common Testing Scenarios

### Scenario 1: Complete New User Onboarding
```
1. Signup (2-step)
2. Create organization
3. Create private tags
4. Create alerts with filters
5. Subscribe to global tags
6. Test all my data endpoints
```

### Scenario 2: Organization Management
```
1. Create organization
2. Send invitations to other users
3. List organization users
4. Update org settings
5. Verify user permissions
```

### Scenario 3: Tag & Alert Management
```
1. Create global tags (as admin)
2. Create private tags (as user)
3. Subscribe to global tags
4. Pin favorite tags
5. Create alerts based on tags
6. Vote to promote private tag
```

### Scenario 4: Search & Discover
```
1. Get available filters
2. Search licitaciones with filters
3. Create alerts from search results
4. Subscribe to related tags
5. Monitor new matches
```

---

## 🐛 Troubleshooting

### "Usuario no autenticado" (401)
**Problem:** Missing or invalid `access_token`
**Solution:** 
1. Re-run login or signup
2. Check token is valid (not expired)
3. Verify Authorization header: `Bearer {{access_token}}`

### "Usuario desactivado" (403)
**Problem:** User account is inactive
**Solution:**
1. Use POST /auth/complete-signup to activate
2. Or POST /users/{id}/activate as admin

### "Requiere roles: ..." (403)
**Problem:** User doesn't have required role
**Solution:**
1. POST /organizations to get ORG_OWNER
2. Contact admin for SUPER_ADMIN role

### "Configuración de repositorio inválida" (400)
**Problem:** Guard can't access database
**Solution:**
1. Restart server
2. Check PostgreSQL is running
3. Check environment variables

### 404 Errors
**Problem:** Resource doesn't exist
**Solution:**
1. Verify ID exists: GET /organizations
2. Use correct ID from recent creation
3. Check soft-delete: entity might be deleted

---

## 📊 Response Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| **200** | OK | Success, data in response |
| **201** | Created | Resource created, ID in response |
| **204** | No Content | Success, no data (DELETE) |
| **400** | Bad Request | Invalid input, fix payload |
| **401** | Unauthorized | Missing/invalid token |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Duplicate or version conflict |
| **500** | Server Error | Report to developers |

---

## 🔗 API Documentation

Full API documentation available at:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI JSON**: `http://localhost:3000/api-json`

---

## 💾 Exporting Results

### Export to CSV
1. Select requests in collection
2. Right-click → Export
3. Choose CSV format

### Generate Report
1. Run full collection
2. Click **►** Run button
3. Set iterations/delays
4. Generate HTML report at end

---

## 🆘 Support

For issues:
1. Check logs: `npm run start:dev`
2. Verify environment: `.env` file
3. Reset DB: Restart server (dev only)
4. Check Postman collection version

---

**Last Updated:** 2026-04-19
**Collection Version:** 1.0.0
**API Version:** v1
