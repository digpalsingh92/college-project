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
  age?: number | null;
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
  refreshToken: string;
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

export interface DoctorAnalyticsRow {
  id: string;
  name: string;
  specialization: string;
  totalAppointments: number;
  upcomingAppointments: number;
}

export interface DoctorAnalyticsListResponse {
  doctors: DoctorAnalyticsRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DoctorResponse {
  doctor: DoctorListItem;
}

export interface PatientAnalyticsRow {
  id: string;
  name: string;
  totalBookings: number;
  lastAppointment: string | null;
  status: "Active" | "Inactive";
}

export interface PatientAnalyticsListResponse {
  patients: PatientAnalyticsRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  patientAge?: number;
  remarks?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  amountPaid?: number;
  insuranceProvider?: string;
  insurancePolicy?: string;
}

export interface AppointmentDto {
  id: string;
  patientId: string;
  doctorId: string;
  scheduleId: string;
  date: string;
  startTime: string;
  endTime: string;
  patientAge?: number | null;
  status: string;
  remarks?: string | null;
  estimatedWaitTime?: number | null;
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

export type WaitLevel = "low" | "moderate" | "high";

export interface SlotPredictionDto {
  time: string;
  startTime: string;
  endTime: string;
  estimatedWaitTime: number;
  waitLevel: WaitLevel;
}

export interface AppointmentSlotsResponse {
  slots: SlotPredictionDto[];
  recommendedSlot: string | null;
  avoidSlot: string | null;
}

export interface AdminAppointmentInsightsResponse {
  totalAppointments: number;
  expectedPatients: number;
  predictedNoShows: number;
  commissionRevenue: number;
  appointmentTrend: Array<{ day: string; appointments: number }>;
  revenueBars: Array<{ month: string; value: number }>;
}

export interface AppointmentCreateResponse {
  appointment: AppointmentDto;
}

export interface AppointmentsListResponse {
  appointments: AppointmentDto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminAppointmentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "booked" | "completed" | "cancelled";
  date?: string;
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

// ── Slot analysis ──

export interface SlotAnalysisSlot {
  startTime: string;
  endTime: string;
  estimatedWaitMinutes: number;
  level: "low" | "medium" | "high";
  noShowAdjustedQueue: number;
}

export interface SlotAnalysisResponse {
  doctorId: string;
  date: string;
  slots: SlotAnalysisSlot[];
  recommendedSlot: SlotAnalysisSlot | null;
  avoidSlot: SlotAnalysisSlot | null;
}

// ── No-show prediction ──

export interface NoShowPredictionRequest {
  age: number;
  gender: string;
  daysDiff: number;
  smsReceived: boolean;
  conditions?: string[];
}

export interface NoShowPredictionResponse {
  probability: number;
  willShow: boolean;
}

// ── Surgery planner ──

export interface SurgeryPlanRequest {
  surgeryType: string;
  patientAge: number;
  conditions?: string[];
}

export interface SurgeryPlanResponse {
  surgeryType: string;
  estimatedCostRange: { min: number; max: number; avg: number };
  bedAvailability: {
    available: number;
    occupancyRate: number;
    level: "low" | "medium" | "high";
  };
  waitingDays: number;
  surgeryDuration: string;
  recoveryDays: number;
  confidence: number;
}

// ── Price estimation ──

export interface PriceEstimationRequest {
  procedure: string;
  condition?: string;
}

export interface PriceEstimationResponse {
  procedure: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
}

// ── Bed availability ──

export interface BedAvailabilityRequest {
  department?: string;
}

export interface BedAvailabilityResponse {
  department: string;
  totalBeds: number;
  freeBeds: number;
  occupancyRate: number;
  level: "low" | "medium" | "high";
  icuAvailable: number;
  staffOnDuty: number;
}

// ── Queue status ──

export interface QueueStatusResponse {
  doctorId: string;
  currentQueue: number;
  expectedPatients: number;
  avgWaitTime: number;
  delayLevel: "low" | "medium" | "high";
}

// ── Recommendations ──

export interface RecommendationsResponse {
  bestTime: string;
  worstTime: string;
  message: string;
}

// ── Assistant ──

export interface AssistantRequest {
  message: string;
}

export interface AssistantResponse {
  intent: "emergency" | "surgery-plan" | "price" | "wait-time" | "bed" | "disease" | "recommendations" | "unknown";
  message: string;
  data: Record<string, unknown>;
  suggestions: string[];
  type?: "price" | "wait-time" | "bed" | "general";
}

