// ── Auth Types ──────────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'doctor' | 'admin' | 'superadmin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ── Patient Types ────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  medicalHistory: string[];
  role: 'patient';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Doctor Types ─────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string[];
  experience: number;
  bio?: string;
  availableSlots?: Record<string, string[]>;
  rating: number;
  isVerified: boolean;
  isActive: boolean;
  role: 'doctor';
  createdAt: string;
  updatedAt: string;
}

// ── Admin Types ──────────────────────────────────────────────────────────────

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Appointment Types ────────────────────────────────────────────────────────

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  status: AppointmentStatus;
  reason?: string;
  symptoms: string[];
  doctorNotes?: string;
  prescriptions: string[];
  duration: number;
  createdAt: string;
  updatedAt: string;
}

// ── AI Types ─────────────────────────────────────────────────────────────────

export interface PredictPayload {
  patients_waiting: number;
  avg_consult_minutes: number;
  doctors_available: number;
  appointment_hour?: number;
  age?: number;
  gender?: 'M' | 'F';
  hypertension?: number;
  diabetes?: number;
  alcoholism?: number;
  handcap?: number;
  scholarship?: number;
  sms_received?: number;
}

export interface PredictResult {
  'Predicted Wait Time': string;
  'Resource Load': 'Low' | 'Medium' | 'High';
  Reason: string;
  _breakdown: {
    base_queue_wait_minutes: number;
    ml_demographic_adjustment_minutes: number;
    patients_per_doctor: number;
  };
}

// ── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export interface PaginatedResponse<T> {
  count: number;
  items: T[];
}
