import axios from 'axios';
import { API_BASE_URL } from '@/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401/403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== 'undefined' && (err.response?.status === 401 || err.response?.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  },
);

export default api;

// ── Patient endpoints ─────────────────────────────────────────────────────────
export const patientApi = {
  register:  (data: object) => api.post('/api/patients/auth/register', data),
  login:     (data: object) => api.post('/api/patients/auth/login', data),
  getProfile: ()            => api.get('/api/patients/profile'),
  updateProfile: (data: object) => api.put('/api/patients/profile', data),

  // Appointments
  createAppointment:  (data: object) => api.post('/api/patients/appointments', data),
  getAppointments:    (params?: object) => api.get('/api/patients/appointments', { params }),
  getAppointmentById: (id: string) => api.get(`/api/patients/appointments/${id}`),
  updateAppointment:  (id: string, data: object) => api.put(`/api/patients/appointments/${id}`, data),
  cancelAppointment:  (id: string) => api.delete(`/api/patients/appointments/${id}`),
};

// ── Doctor endpoints ──────────────────────────────────────────────────────────
export const doctorApi = {
  register:  (data: object) => api.post('/api/doctors/auth/register', data),
  login:     (data: object) => api.post('/api/doctors/auth/login', data),
  getProfile: ()            => api.get('/api/doctors/profile/me'),
  updateProfile: (data: object) => api.put('/api/doctors/profile/me', data),
  getAll:     ()            => api.get('/api/doctors'),
  getById:    (id: string)  => api.get(`/api/doctors/${id}`),
  getBySpecialization: (spec: string) => api.get(`/api/doctors/specialization/${spec}`),

  // Appointments
  getAppointments:  (params?: object) => api.get('/api/doctors/me/appointments', { params }),
  getUpcoming:      ()                => api.get('/api/doctors/me/appointments/upcoming'),
  addNotes:         (id: string, data: object) => api.put(`/api/doctors/appointments/${id}/notes`, data),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────
export const adminApi = {
  login:           (data: object) => api.post('/api/admin/auth/login', data),
  register:        (data: object) => api.post('/api/admin/auth/register', data),
  getDashboard:    ()             => api.get('/api/admin/dashboard'),
  getUsers:        ()             => api.get('/api/admin/users'),
  updateUserStatus: (id: string, data: object) => api.patch(`/api/admin/users/${id}/status`, data),
};

// ── AI endpoints ──────────────────────────────────────────────────────────────
export const aiApi = {
  predict:      (data: object) => api.post('/api/ai/predict', data),
  symptomCheck: (data: object) => api.post('/api/ai/symptom-check', data),
};
