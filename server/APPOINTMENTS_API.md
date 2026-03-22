# RESTful API Documentation - Appointments & User Management

## Overview

This document outlines the new RESTful API endpoints for patient (user) creation, profile management, and appointment scheduling in the healthcare microservices system.

---

## Table of Contents

1. [Patient Service APIs](#patient-service-apis)
   - [Authentication](#authentication)
   - [Profile Management](#profile-management)
   - [Appointments](#appointments)
2. [Doctor Service APIs](#doctor-service-apis)
   - [Authentication](#doctor-authentication)
   - [Profile Management](#doctor-profile-management)
   - [Appointments](#doctor-appointments)
3. [Error Handling](#error-handling)
4. [Example Payloads](#example-payloads)

---

## Patient Service APIs

**Base URL:** `http://localhost:3000/api/patients` (via API Gateway)
**Direct URL:** `http://localhost:3001/api/patients` (direct service)

### Authentication

#### Register Patient

Creates a new patient account in the system.

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "address": "123 Main St, City, Country"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "patient": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

**Validation Rules:**
- `name`: Required, non-empty string
- `email`: Required, valid email format, unique
- `password`: Required, minimum 8 characters
- `phone`: Optional, string
- `dateOfBirth`: Optional, ISO 8601 date
- `gender`: Optional, one of: `male`, `female`, `other`
- `address`: Optional, string

---

#### Login Patient

Authenticates a patient and returns a JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "patient": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Login failed

---

### Profile Management

#### Get Patient Profile

Retrieves the authenticated patient's profile.

```http
GET /profile
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "patient": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "male",
    "address": "123 Main St, City, Country",
    "medicalHistory": ["Diabetes", "Hypertension"],
    "role": "patient",
    "isActive": true,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-21T15:30:00.000Z"
  }
}
```

---

#### Update Patient Profile

Updates the authenticated patient's profile information.

```http
PUT /profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phone": "+9876543210",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "address": "456 New Address, City, Country"
}
```

**Response (200 OK):**
```json
{
  "patient": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe Updated",
    "email": "john@example.com",
    "phone": "+9876543210",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "male",
    "address": "456 New Address, City, Country",
    "medicalHistory": ["Diabetes", "Hypertension"],
    "role": "patient",
    "isActive": true,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-21T16:45:00.000Z"
  }
}
```

---

### Appointments

#### Create Appointment

Books a new appointment with a doctor.

```http
POST /appointments
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "doctorId": "507f1f77bcf86cd799439022",
  "appointmentDate": "2024-04-15T10:30:00Z",
  "reason": "Regular checkup",
  "symptoms": ["Headache", "Fatigue"],
  "duration": 30
}
```

**Response (201 Created):**
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "_id": "507f1f77bcf86cd799439033",
    "patientId": "507f1f77bcf86cd799439011",
    "doctorId": "507f1f77bcf86cd799439022",
    "appointmentDate": "2024-04-15T10:30:00.000Z",
    "status": "pending",
    "reason": "Regular checkup",
    "symptoms": ["Headache", "Fatigue"],
    "duration": 30,
    "doctorNotes": null,
    "prescriptions": [],
    "createdAt": "2024-03-21T10:00:00.000Z",
    "updatedAt": "2024-03-21T10:00:00.000Z"
  }
}
```

**Validation Rules:**
- `doctorId`: Required, valid MongoDB ObjectId
- `appointmentDate`: Required, ISO 8601 date in the future
- `reason`: Optional, string
- `symptoms`: Optional, array of strings
- `duration`: Optional, number (default: 30 minutes)

**Error Responses:**
- `400 Bad Request`: Appointment date in the past
- `409 Conflict`: Duplicate appointment exists
- `500 Internal Server Error`: Creation failed

---

#### Get Patient's Appointments

Retrieves all appointments for the authenticated patient.

```http
GET /appointments?status=confirmed&upcomingOnly=true
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status`: Optional, filter by status (`pending`, `confirmed`, `completed`, `cancelled`)
- `upcomingOnly`: Optional, boolean (default: false) - show only future appointments

**Response (200 OK):**
```json
{
  "count": 2,
  "appointments": [
    {
      "_id": "507f1f77bcf86cd799439033",
      "patientId": "507f1f77bcf86cd799439011",
      "doctorId": "507f1f77bcf86cd799439022",
      "appointmentDate": "2024-04-15T10:30:00.000Z",
      "status": "confirmed",
      "reason": "Regular checkup",
      "symptoms": ["Headache", "Fatigue"],
      "duration": 30,
      "doctorNotes": "Patient stable",
      "prescriptions": ["Aspirin 500mg"],
      "createdAt": "2024-03-21T10:00:00.000Z",
      "updatedAt": "2024-03-21T11:00:00.000Z"
    }
  ]
}
```

---

#### Get Specific Appointment

Retrieves details of a specific appointment.

```http
GET /appointments/:appointmentId
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "appointment": {
    "_id": "507f1f77bcf86cd799439033",
    "patientId": "507f1f77bcf86cd799439011",
    "doctorId": "507f1f77bcf86cd799439022",
    "appointmentDate": "2024-04-15T10:30:00.000Z",
    "status": "confirmed",
    "reason": "Regular checkup",
    "symptoms": ["Headache", "Fatigue"],
    "duration": 30,
    "doctorNotes": "Patient stable",
    "prescriptions": ["Aspirin 500mg"],
    "createdAt": "2024-03-21T10:00:00.000Z",
    "updatedAt": "2024-03-21T11:00:00.000Z"
  }
}
```

---

#### Update Appointment Status

Updates the status of an appointment (used by doctors to confirm/complete appointments).

```http
PUT /appointments/:appointmentId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "confirmed",
  "doctorNotes": "Appointment confirmed for treatment",
  "prescriptions": ["Medication A", "Medication B"]
}
```

**Response (200 OK):**
```json
{
  "message": "Appointment updated successfully",
  "appointment": {
    "_id": "507f1f77bcf86cd799439033",
    "patientId": "507f1f77bcf86cd799439011",
    "doctorId": "507f1f77bcf86cd799439022",
    "appointmentDate": "2024-04-15T10:30:00.000Z",
    "status": "confirmed",
    "reason": "Regular checkup",
    "symptoms": ["Headache", "Fatigue"],
    "duration": 30,
    "doctorNotes": "Appointment confirmed for treatment",
    "prescriptions": ["Medication A", "Medication B"],
    "createdAt": "2024-03-21T10:00:00.000Z",
    "updatedAt": "2024-03-21T12:00:00.000Z"
  }
}
```

**Valid Status Values:**
- `pending`: Initial status when appointment is created
- `confirmed`: Doctor confirmed the appointment
- `completed`: Appointment has been completed
- `cancelled`: Appointment was cancelled

---

#### Cancel Appointment

Cancels an existing appointment.

```http
DELETE /appointments/:appointmentId
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Appointment cancelled successfully",
  "appointment": {
    "_id": "507f1f77bcf86cd799439033",
    "patientId": "507f1f77bcf86cd799439011",
    "doctorId": "507f1f77bcf86cd799439022",
    "appointmentDate": "2024-04-15T10:30:00.000Z",
    "status": "cancelled",
    "reason": "Regular checkup",
    "symptoms": ["Headache", "Fatigue"],
    "duration": 30,
    "doctorNotes": null,
    "prescriptions": [],
    "createdAt": "2024-03-21T10:00:00.000Z",
    "updatedAt": "2024-03-21T13:00:00.000Z"
  }
}
```

---

## Doctor Service APIs

**Base URL:** `http://localhost:3000/api/doctors` (via API Gateway)
**Direct URL:** `http://localhost:3003/api/doctors` (direct service)

### Doctor Authentication

#### Register Doctor

Creates a new doctor account in the system.

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Dr. Jane Smith",
  "email": "jane.smith@hospital.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "specialization": "Cardiology",
  "licenseNumber": "MD-12345-67890",
  "qualifications": ["MD", "Board Certified"],
  "experience": 10,
  "bio": "Experienced cardiologist with 10 years of practice"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "id": "507f1f77bcf86cd799439022",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@hospital.com",
    "specialization": "Cardiology",
    "role": "doctor"
  }
}
```

---

#### Login Doctor

Authenticates a doctor and returns a JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "jane.smith@hospital.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "id": "507f1f77bcf86cd799439022",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@hospital.com",
    "specialization": "Cardiology",
    "role": "doctor"
  }
}
```

---

### Doctor Profile Management

#### Get Doctor Profile

Retrieves the authenticated doctor's profile.

```http
GET /profile/me
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "doctor": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@hospital.com",
    "phone": "+1234567890",
    "specialization": "Cardiology",
    "licenseNumber": "MD-12345-67890",
    "qualifications": ["MD", "Board Certified"],
    "experience": 10,
    "bio": "Experienced cardiologist with 10 years of practice",
    "rating": 4.8,
    "availableSlots": [
      {
        "day": "Monday",
        "startTime": "09:00",
        "endTime": "17:00"
      },
      {
        "day": "Wednesday",
        "startTime": "10:00",
        "endTime": "16:00"
      }
    ],
    "isVerified": true,
    "isActive": true,
    "role": "doctor",
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-21T15:30:00.000Z"
  }
}
```

---

#### Update Doctor Profile

Updates the authenticated doctor's profile information.

```http
PUT /profile/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Dr. Jane Smith",
  "phone": "+9876543210",
  "bio": "Experienced cardiologist with 12 years of practice",
  "experience": 12,
  "qualifications": ["MD", "Board Certified", "Fellowship"],
  "availableSlots": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "17:00"
    },
    {
      "day": "Tuesday",
      "startTime": "10:00",
      "endTime": "15:00"
    },
    {
      "day": "Thursday",
      "startTime": "09:00",
      "endTime": "17:00"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "doctor": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@hospital.com",
    "phone": "+9876543210",
    "specialization": "Cardiology",
    "licenseNumber": "MD-12345-67890",
    "qualifications": ["MD", "Board Certified", "Fellowship"],
    "experience": 12,
    "bio": "Experienced cardiologist with 12 years of practice",
    "availableSlots": [
      {
        "day": "Monday",
        "startTime": "09:00",
        "endTime": "17:00"
      },
      {
        "day": "Tuesday",
        "startTime": "10:00",
        "endTime": "15:00"
      },
      {
        "day": "Thursday",
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ],
    "rating": 4.8,
    "isVerified": true,
    "isActive": true,
    "role": "doctor",
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-21T16:45:00.000Z"
  }
}
```

---

### Doctor Appointments

#### Get Doctor's Upcoming Appointments

Retrieves all upcoming appointments for the authenticated doctor.

```http
GET /me/appointments/upcoming
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "count": 3,
  "appointments": [
    {
      "_id": "507f1f77bcf86cd799439033",
      "patientId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "doctorId": "507f1f77bcf86cd799439022",
      "appointmentDate": "2024-04-15T10:30:00.000Z",
      "status": "confirmed",
      "reason": "Regular checkup",
      "symptoms": ["Headache", "Fatigue"],
      "duration": 30,
      "doctorNotes": null,
      "prescriptions": [],
      "createdAt": "2024-03-21T10:00:00.000Z",
      "updatedAt": "2024-03-21T10:00:00.000Z"
    }
  ]
}
```

---

#### Get Doctor's Appointments

Retrieves all appointments for the authenticated doctor with optional filtering.

```http
GET /me/appointments?status=pending
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status`: Optional, filter by status (`pending`, `confirmed`, `completed`, `cancelled`)
- `upcomingOnly`: Optional, boolean (default: false) - show only future appointments

**Response (200 OK):**
```json
{
  "count": 2,
  "appointments": [
    {
      "_id": "507f1f77bcf86cd799439033",
      "patientId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "doctorId": "507f1f77bcf86cd799439022",
      "appointmentDate": "2024-04-15T10:30:00.000Z",
      "status": "pending",
      "reason": "Regular checkup",
      "symptoms": ["Headache", "Fatigue"],
      "duration": 30,
      "doctorNotes": null,
      "prescriptions": [],
      "createdAt": "2024-03-21T10:00:00.000Z",
      "updatedAt": "2024-03-21T10:00:00.000Z"
    }
  ]
}
```

---

#### Add Doctor Notes to Appointment

Adds clinical notes and prescriptions to a completed appointment.

```http
PUT /appointments/:appointmentId/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "doctorNotes": "Patient presents with normal vitals. Recommended daily exercise and healthy diet.",
  "prescriptions": ["Vitamin D 1000IU daily", "Aspirin 500mg as needed"]
}
```

**Response (200 OK):**
```json
{
  "message": "Doctor notes added successfully",
  "appointment": {
    "_id": "507f1f77bcf86cd799439033",
    "patientId": "507f1f77bcf86cd799439011",
    "doctorId": "507f1f77bcf86cd799439022",
    "appointmentDate": "2024-04-15T10:30:00.000Z",
    "status": "completed",
    "reason": "Regular checkup",
    "symptoms": ["Headache", "Fatigue"],
    "duration": 30,
    "doctorNotes": "Patient presents with normal vitals. Recommended daily exercise and healthy diet.",
    "prescriptions": ["Vitamin D 1000IU daily", "Aspirin 500mg as needed"],
    "createdAt": "2024-03-21T10:00:00.000Z",
    "updatedAt": "2024-03-21T14:00:00.000Z"
  }
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

### Common Error Responses

#### 400 Bad Request
Invalid input or validation error.

```json
{
  "error": "Appointment date must be in the future"
}
```

#### 401 Unauthorized
Missing or invalid authentication token.

```json
{
  "error": "Invalid credentials"
}
```

#### 404 Not Found
Resource not found.

```json
{
  "error": "Appointment not found"
}
```

#### 409 Conflict
Resource already exists (e.g., duplicate email or appointment).

```json
{
  "error": "Email already registered"
}
```

#### 500 Internal Server Error
Server-side error.

```json
{
  "error": "Failed to create appointment"
}
```

---

## Example Payloads

### Complete Patient Registration Flow

1. **Register**
```bash
curl -X POST http://localhost:3000/api/patients/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone": "+1234567890",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "address": "123 Main St, City"
  }'
```

2. **Get Profile**
```bash
curl -X GET http://localhost:3000/api/patients/profile \
  -H "Authorization: Bearer <jwt_token>"
```

3. **Create Appointment**
```bash
curl -X POST http://localhost:3000/api/patients/appointments \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "507f1f77bcf86cd799439022",
    "appointmentDate": "2024-04-15T10:30:00Z",
    "reason": "Regular checkup",
    "symptoms": ["Headache"]
  }'
```

---

## Integration with API Gateway

All endpoints are proxied through the API Gateway at port 3000:

- Patient Service endpoints: `/api/patients/*`
- Doctor Service endpoints: `/api/doctors/*`
- Admin Service endpoints: `/api/admin/*`
- AI Service endpoints: `/api/ai/*`

The API Gateway adds the `x-user-id` header from the JWT token to all protected requests, making the user's ID available to services.

---

## Database Schema

### Appointment Model

```typescript
interface IAppointment {
  _id: ObjectId;
  patientId: ObjectId;        // Reference to Patient
  doctorId: ObjectId;         // Reference to Doctor
  appointmentDate: Date;      // ISO 8601 datetime
  status: string;             // pending | confirmed | completed | cancelled
  reason?: string;            // Reason for visit
  symptoms?: string[];        // List of symptoms
  doctorNotes?: string;       // Notes added after appointment
  prescriptions?: string[];   // Medications prescribed
  duration?: number;          // Duration in minutes (default: 30)
  createdAt: Date;           // Timestamp
  updatedAt: Date;           // Timestamp
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- JWT tokens expire after 7 days by default (configurable via `JWT_EXPIRES` env var)
- Passwords are hashed using bcryptjs with salt rounds = 12
- MongoDB ObjectIds are used for all entity references
- Appointments must be scheduled at least 1 hour apart from existing appointments
- Doctors can only add notes to appointments they are assigned to
- Patients can only view/modify their own appointments
