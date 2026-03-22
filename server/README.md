# Backend – Microservices Architecture

## Services

| Service | Stack | Port | Path |
|---|---|---|---|
| **API Gateway** | Node.js + Express + TypeScript | 3000 | `api-gateway/` |
| **Patient Service** | Node.js + Express + TypeScript | 3001 | `services/patient-service/` |
| **Admin Service** | Node.js + Express + TypeScript | 3002 | `services/admin-service/` |
| **Doctor Service** | Node.js + Express + TypeScript | 3003 | `services/doctor-service/` |
| **AI Service** | Python + Flask | 5000 | `services/ai-service/` |

## Quick Start (Docker)

```bash
cd server
cp .env.example .env          # fill in JWT_SECRET
docker compose up --build
```

All traffic flows through the **API Gateway** on port **3000**.

## Quick Start (local dev)

> Requires: Node 20+, Python 3.11+, MongoDB running on 27017

### Node services

```bash
# repeat for api-gateway, patient-service, admin-service, doctor-service
cd api-gateway          # or services/<name>-service
cp .env.example .env
npm install
npm run dev
```

### AI service

```bash
cd services/ai-service
cp .env.example .env
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

## API Routes (via Gateway)

| Method | Path | Service | Auth |
|---|---|---|---|
| POST | `/api/patients/auth/register` | patient | public |
| POST | `/api/patients/auth/login` | patient | public |
| GET | `/api/patients/profile` | patient | JWT |
| PUT | `/api/patients/profile` | patient | JWT |
| POST | `/api/doctors/auth/register` | doctor | public |
| POST | `/api/doctors/auth/login` | doctor | public |
| GET | `/api/doctors` | doctor | public |
| GET | `/api/doctors/:id` | doctor | public |
| GET | `/api/doctors/profile/me` | doctor | JWT |
| POST | `/api/admin/auth/login` | admin | public |
| GET | `/api/admin/dashboard` | admin | JWT |
| POST | `/api/ai/predict` | ai | JWT |
| POST | `/api/ai/symptom-check` | ai | JWT |

## Adding a new service

1. Create `services/<name>-service/` following the same structure.
2. Add a Docker service entry in `docker-compose.yml`.
3. Add a proxy route in `api-gateway/src/index.ts`.
