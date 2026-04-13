/** Mirrors server contracts under `server/src`. */

export type ApiRole = "patient" | "doctor" | "admin";

export interface DoctorProfileDto {
  specialization: string;
  experience: number;
  consultationFee: number;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: Exclude<ApiRole, "admin"> | ApiRole;
  createdAt: string;
  doctorProfile?: DoctorProfileDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterPatientRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterDoctorRequest extends RegisterPatientRequest {
  specialization: string;
  experience: number;
  consultationFee: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUserDto;
}

export interface ApiErrorBody {
  message: string;
  details?: unknown;
}

export interface DoctorListItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  doctorProfile: DoctorProfileDto | null;
}

export interface DoctorsListResponse {
  doctors: DoctorListItem[];
}

export interface DoctorResponse {
  doctor: DoctorListItem;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AppointmentDto {
  id: string;
  patientId: string;
  doctorId: string;
  scheduleId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  remarks?: string | null;
  createdAt: string;
  patient?: {
    name: string;
  };
  doctor?: {
    name: string;
    email?: string;
    doctorProfile?: {
      specialization?: string;
      consultationFee?: number;
    };
  };
}

export interface AppointmentCreateResponse {
  appointment: AppointmentDto;
}

export interface AppointmentsListResponse {
  appointments: AppointmentDto[];
}

export interface AppointmentMutationResponse {
  appointment: AppointmentDto;
}

export interface UpdateAppointmentByDoctorRequest {
  status: "booked" | "completed" | "no_show" | "cancelled";
  remarks?: string;
}

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface CreateScheduleRequest {
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
}

export interface AddUnavailabilityRequest {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface ScheduleDto {
  id: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface SchedulesListResponse {
  schedules: ScheduleDto[];
}

export interface UpdateScheduleRequest {
  dayOfWeek?: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface UnavailabilityDto {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
}

export interface UnavailabilitiesListResponse {
  unavailabilities: UnavailabilityDto[];
}

export interface DeleteResponse {
  success: boolean;
}

export interface DoctorAvailabilitySlotDto {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  status: "available" | "booked" | "unavailable";
}

export interface DoctorAvailabilityResponse {
  doctorId: string;
  date: string;
  slotDurationMinutes: number;
  slots: Array<{ startTime: string; endTime: string }>;
  allSlots: DoctorAvailabilitySlotDto[];
}


export interface WaitingTimePredictionRequest {
  department: string;
  appointmentType: string;
  scheduledHour: number;
  reminderSent: "Yes" | "No";
  previousNoShows?: number;
}

export interface ResourceAllocationPredictionRequest {
  department: string;
  scheduledHour: number;
  expectedAppointments?: number;
}

export interface TrainModelRequest {
  datasetPath?: string;
}
