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
