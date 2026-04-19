// ── Existing types (wait-time / resource) ──

export type ReminderSent = "Yes" | "No";

export type AppointmentStatus = "Completed" | "No-Show" | "Cancelled";

export interface DatasetRow {
  appointmentId: number;
  appointmentDate: string;
  patientAge: number;
  gender: string;
  department: string;
  appointmentType: string;
  scheduledHour: number;
  waitingTimeMinutes: number;
  reminderSent: ReminderSent;
  previousNoShows: number;
  appointmentStatus: AppointmentStatus;
}

export interface BucketStats {
  count: number;
  avgWaitingMinutes: number;
  p90WaitingMinutes: number;
  noShowRate: number;
  cancelRate: number;
}

export interface WaitingTimeModel {
  global: BucketStats;
  byDepartment: Record<string, BucketStats>;
  byDepartmentAppointmentType: Record<string, BucketStats>;
  byDepartmentAppointmentTypeHourReminder: Record<string, BucketStats>;
}

export interface ResourceRecommendation {
  observations: number;
  avgWaitingMinutes: number;
  noShowRate: number;
  cancelRate: number;
  recommendedDoctors: number;
  recommendedNurses: number;
  recommendedFrontDesk: number;
  riskLevel: "low" | "medium" | "high";
}

export interface ResourceAllocationModel {
  byDepartmentHour: Record<string, ResourceRecommendation>;
}

export interface TrainedPredictionModel {
  version: string;
  trainedAt: string;
  datasetPath: string;
  datasetRecords: number;
  waitingTimeModel: WaitingTimeModel;
  resourceAllocationModel: ResourceAllocationModel;
  llmInsights: {
    provider: "mistral";
    model: string;
    generated: boolean;
    notes: string[];
    rawResponse?: string;
  };
}

// ── No-Show model ──

export interface NoShowBucket {
  count: number;
  noShowRate: number;
}

export interface NoShowModel {
  version: string;
  trainedAt: string;
  datasetRecords: number;
  globalNoShowRate: number;
  byAgeBucket: Record<string, NoShowBucket>;
  byGender: Record<string, NoShowBucket>;
  bySmsReceived: Record<string, NoShowBucket>;
  byDaysDiffBucket: Record<string, NoShowBucket>;
  byComposite: Record<string, NoShowBucket>;
}

// ── Price model ──

export interface PriceBucket {
  procedure: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
}

export interface PriceModel {
  version: string;
  trainedAt: string;
  datasetRecords: number;
  byProcedure: Record<string, PriceBucket>;
  procedures: string[];
}

// ── Bed model ──

export interface BedDepartmentStats {
  department: string;
  totalBeds: number;
  freeBeds: number;
  totalIcuBeds: number;
  freeIcuBeds: number;
  occupancyRate: number;
  icuOccupancyRate: number;
  staffOnDuty: number;
}

export interface BedModel {
  version: string;
  trainedAt: string;
  datasetRecords: number;
  byDepartment: Record<string, BedDepartmentStats>;
  departments: string[];
  globalOccupancyRate: number;
}

// ── Surgery planner result ──

export interface SurgeryPlanResult {
  surgeryType: string;
  estimatedCostRange: { min: number; max: number; avg: number };
  bedAvailability: { available: number; occupancyRate: number; level: "low" | "medium" | "high" };
  waitingDays: number;
  surgeryDuration: string;
  recoveryDays: number;
  confidence: number;
}

// ── Slot analysis ──

export interface SlotAnalysis {
  startTime: string;
  endTime: string;
  estimatedWaitMinutes: number;
  level: "low" | "medium" | "high";
  noShowAdjustedQueue: number;
}

export interface SlotAnalysisResult {
  doctorId: string;
  date: string;
  slots: SlotAnalysis[];
  recommendedSlot: SlotAnalysis | null;
  avoidSlot: SlotAnalysis | null;
}

// ── Queue status ──

export interface QueueStatusResult {
  doctorId: string;
  currentQueue: number;
  expectedPatients: number;
  avgWaitTime: number;
  delayLevel: "low" | "medium" | "high";
}

// ── Recommendations ──

export interface RecommendationsResult {
  bestTime: string;
  worstTime: string;
  message: string;
}
