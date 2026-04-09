# College Project Brief Reference

## 1. Project Summary
This is a full-stack healthcare appointment platform with:
- A Next.js frontend for patients, doctors, and admin dashboards
- An Express + Prisma backend with JWT authentication
- A prediction module for:
  - Waiting time prediction
  - Hospital resource allocation prediction
- A training pipeline that uses your dataset and can enrich insights with Mistral

## 2. Tech Stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind, Zustand, Zod
- Backend: Express, TypeScript, Prisma, PostgreSQL, JWT, Zod
- AI/ML: Node.js training pipeline over CSV dataset + optional Mistral API call

## 3. Project Structure
- client: Next.js web app (role-based pages and dashboards)
- server: Express API, Prisma schema, auth, schedules, appointments, prediction module
- server/src/ml: training, inference, model artifact storage

## 4. Quick Run Commands
### Frontend
```bash
cd client
npm install
npm run dev
```
Runs on default: http://localhost:3000

### Backend
```bash
cd server
npm install
npm run dev
```
Runs on default: http://localhost:4000

### Build Backend
```bash
cd server
npm run build
```

### Train Prediction Model
```bash
cd server
npm run ml:train
```
Optional custom dataset path:
```bash
cd server
npm run ml:train -- "./src/Datasets/healthcare_appointment_no_show_wait_time.csv"
```

## 5. Environment Variables (Server)
Create a .env file inside server with at least:
```env
PORT=4000
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_postgres_url
MISTRAL_API_KEY=your_mistral_key_optional
```
Notes:
- MISTRAL_API_KEY is optional for training.
- If MISTRAL_API_KEY is missing, training still works using deterministic statistical modeling.

## 6. Current Backend API Base
Base URL: http://localhost:4000

All mounted routes:
- /api/auth
- /api/doctors
- /api/appointments
- /api/predictions

---

## 7. Auth APIs
### POST /api/auth/doctor/register
Register a doctor.

Body:
```json
{
  "name": "Dr John",
  "email": "john@example.com",
  "password": "secret123",
  "specialization": "Cardiology",
  "experience": 8,
  "consultationFee": 1500
}
```

### POST /api/auth/doctor/login
Doctor login.

### POST /api/auth/register
Patient register.

Body:
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```

### POST /api/auth/login
Patient login.

Body:
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

---

## 8. Doctor Schedule APIs
Authentication: Bearer token required.

### POST /api/doctors/schedules
Role required: doctor.

Body:
```json
{
  "doctorId": "uuid",
  "dayOfWeek": "MONDAY",
  "startTime": "10:00 AM",
  "endTime": "2:00 PM"
}
```

### POST /api/doctors/unavailability
Role required: doctor.

Body:
```json
{
  "doctorId": "uuid",
  "date": "2026-04-10",
  "startTime": "12:00 PM",
  "endTime": "1:00 PM",
  "reason": "Surgery"
}
```

### GET /api/doctors/:doctorId/availability?date=YYYY-MM-DD&slotDurationMinutes=30
Any authenticated user can request availability.

---

## 9. Appointment API
Authentication: Bearer token required.

### POST /api/appointments
Role required: patient.

Body:
```json
{
  "doctorId": "uuid",
  "date": "2026-04-10",
  "startTime": "10:00 AM",
  "endTime": "10:30 AM"
}
```

---

## 10. Prediction APIs (New)
### POST /api/predictions/waiting-time
Public endpoint (no auth currently).

Body:
```json
{
  "department": "Cardiology",
  "appointmentType": "Follow-up",
  "scheduledHour": 10,
  "reminderSent": "Yes",
  "previousNoShows": 1
}
```

Returns: predicted waiting time, p90 wait, risk rates, confidence, model metadata.

### POST /api/predictions/resource-allocation
Public endpoint (no auth currently).

Body:
```json
{
  "department": "Cardiology",
  "scheduledHour": 10,
  "expectedAppointments": 45
}
```

Returns: recommended doctors, nurses, front-desk count, risk level, and supporting stats.

### POST /api/predictions/train
Authentication: Bearer token required.
Role required: admin.

Optional body:
```json
{
  "datasetPath": "./src/Datasets/healthcare_appointment_no_show_wait_time.csv"
}
```

Trains/retrains the model and saves artifact to:
- src/ml/artifacts/waiting_resource_model.json

### POST /api/predictions/reload
Authentication: Bearer token required.
Role required: admin.

Reloads model artifact into memory.

---

## 11. Dataset and Model Notes
- Primary dataset currently used for training:
  - server/src/Datasets/healthcare_appointment_no_show_wait_time.csv
- Model artifact generated after training:
  - server/src/ml/artifacts/waiting_resource_model.json
- Training approach:
  - Builds statistical bucket models from dataset
  - Uses Mistral (if key is available) for additional operational insight text

## 12. Important Roles
- patient: can create appointments
- doctor: can create schedule and unavailability
- admin: can train/reload prediction model

## 13. Current Next Focus (Suggested)
- Protect public prediction endpoints if needed (auth/rate limiting)
- Add Swagger/OpenAPI docs
- Add prediction UI pages in client for admin/doctor dashboards
