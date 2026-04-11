# 📋 LicitaApp

SaaS de licitaciones públicas en España.

## Quick Start

### 1. Clonar e instalar
git clone [url]
cd licitaapp
npm install

### 2. Arrancar servicios (PostgreSQL, Redis, Qdrant)
IMPORTANTE: Si tienes PostgreSQL instalado en Windows, páralo primero:
(PowerShell como Admin) net stop postgresql-x64-17

docker compose up -d

### 3. Arrancar el backend
cd apps/backend
npm run start:dev
- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Bull Board: http://localhost:3000/admin/queues

### 4. Arrancar la web
cd apps/web
npm run dev
- Web: http://localhost:5173

### 5. Arrancar el servicio IA
cd licitaapp-ia
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
- IA: http://localhost:8000
- Docs: http://localhost:8000/docs

## Stack
- Backend: NestJS + TypeORM + PostgreSQL
- Frontend: React + Vite + TailwindCSS + shadcn/ui
- IA: FastAPI + OpenAI + Qdrant
- Colas: BullMQ + Redis
- Monorepo: Turborepo

## Credenciales de desarrollo
- PostgreSQL: postgres/postgres en localhost:5432
- Base de datos: licitaapp
- Usuario test: admin@test.com / test1234
