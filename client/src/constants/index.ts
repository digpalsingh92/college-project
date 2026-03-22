export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const ROUTES = {
  home: '/',
  about: '/about',
  contact: '/contact',

  // Auth
  patientLogin: '/auth/patient/login',
  patientRegister: '/auth/patient/register',
  doctorLogin: '/auth/doctor/login',
  doctorRegister: '/auth/doctor/register',
  adminLogin: '/auth/admin/login',

  // Patient dashboards
  patientDashboard: '/patient/dashboard',
  patientAppointments: '/patient/appointments',
  patientReports: '/patient/reports',

  // Doctor dashboards
  doctorDashboard: '/doctor/dashboard',
  doctorPatients: '/doctor/patients',
  doctorSchedule: '/doctor/schedule',

  // Admin dashboards
  adminDashboard: '/admin/dashboard',
  adminUsers: '/admin/users',
  adminAppointments: '/admin/appointments',
} as const;

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const RESOURCE_LOAD_COLORS: Record<string, string> = {
  Low: 'text-green-400',
  Medium: 'text-yellow-400',
  High: 'text-red-400',
};

export const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedic',
  'Pediatrician',
  'Psychiatrist',
  'Gynecologist',
  'Oncologist',
  'ENT Specialist',
  'Ophthalmologist',
  'Urologist',
  'Endocrinologist',
  'Gastroenterologist',
  'Pulmonologist',
];
