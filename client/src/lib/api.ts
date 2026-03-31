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
  register:  (data: object) => api.post('/patients/register', data),
  login:     (data: object) => api.post('/patients/login', data),
  getProfile: ()            => api.get('/patients/profile'),
  updateProfile: (data: object) => api.put('/patients/profile', data),

  // Appointments
  createAppointment:  (data: object) => api.post('/patients/appointments', data),
  getAppointments:    (params?: object) => api.get('/patients/appointments', { params }),
  getAppointmentById: (id: string) => api.get(`/patients/appointments/${id}`),
  updateAppointment:  (id: string, data: object) => api.put(`/patients/appointments/${id}`, data),
  cancelAppointment:  (id: string) => api.delete(`/patients/appointments/${id}`),
};

// ── Doctor endpoints ──────────────────────────────────────────────────────────
export const doctorApi = {
  register:  (data: object) => api.post('/doctor/register', data),
  login:     (data: object) => api.post('/doctor/login', data),
  getProfile: ()            => api.get('/doctor/profile/me'),
  updateProfile: (data: object) => api.put('/doctor/profile/me', data),
  getAll:     ()            => api.get('/doctor'),
  getById:    (id: string)  => api.get(`/doctor/${id}`),
  getBySpecialization: (spec: string) => api.get(`/doctor/specialization/${spec}`),

  // Appointments
  getAppointments:  (params?: object) => api.get('/doctor/me/appointments', { params }),
  getUpcoming:      ()                => api.get('/doctor/me/appointments/upcoming'),
  addNotes:         (id: string, data: object) => api.put(`/doctor/appointments/${id}/notes`, data),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────
export const adminApi = {
  login:           (data: object) => api.post('/admin/login', data),
  register:        (data: object) => api.post('/admin/register', data),
  getDashboard:    ()             => api.get('/admin/dashboard'),
  getUsers:        ()             => api.get('/admin/users'),
  getDoctors:      ()             => api.get('/admin/doctors'),
  getPatients:     ()             => api.get('/admin/patients'),
  getAppointments: ()             => api.get('/admin/appointments'),
  updateUserStatus: (id: string, data: object) => api.patch(`/admin/users/${id}/status`, data),
};

// ── AI endpoints ──────────────────────────────────────────────────────────────
export const aiApi = {
  predict:      (data: object) => api.post('/ai/predict', data),
  symptomCheck: (data: object) => api.post('/ai/symptom-check', data),
};
