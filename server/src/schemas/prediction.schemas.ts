import { z } from "zod";

// ── Existing schemas ──

export const waitingTimePredictionSchema = z.object({
  department: z.string().trim().min(1),
  appointmentType: z.string().trim().min(1),
  scheduledHour: z.number().int().min(0).max(23),
  reminderSent: z.enum(["Yes", "No"]),
  previousNoShows: z.number().int().min(0).max(20).default(0),
});

export const resourceAllocationPredictionSchema = z.object({
  department: z.string().trim().min(1),
  scheduledHour: z.number().int().min(0).max(23),
  expectedAppointments: z.number().int().positive().optional(),
});

export const trainModelSchema = z.object({
  datasetPath: z.string().trim().min(1).optional(),
});

// ── New schemas ──

export const noShowPredictionSchema = z.object({
  age: z.number().int().min(0).max(120),
  gender: z.string().trim().min(1),
  daysDiff: z.number().int().min(0),
  smsReceived: z.boolean(),
  conditions: z.array(z.string()).optional(),
});

export const surgeryPlanSchema = z.object({
  surgeryType: z.string().trim().min(1),
  patientAge: z.number().int().min(0).max(120),
  conditions: z.array(z.string()).optional(),
});

export const priceEstimationSchema = z.object({
  procedure: z.string().trim().min(1),
  condition: z.string().trim().min(1).optional(),
});

export const bedAvailabilitySchema = z.object({
  department: z.string().trim().min(1).optional(),
});

export const diseasePredictionSchema = z.object({
  fever: z.boolean(),
  cough: z.boolean(),
  fatigue: z.boolean(),
  difficultyBreathing: z.boolean(),
  age: z.number().int().min(0).max(120),
  gender: z.string().trim().min(1),
  bloodPressure: z.enum(["Low", "Normal", "High"]),
  cholesterolLevel: z.enum(["Low", "Normal", "High"]),
});

// ── Inferred types ──

export type WaitingTimePredictionInput = z.infer<typeof waitingTimePredictionSchema>;
export type ResourceAllocationPredictionInput = z.infer<typeof resourceAllocationPredictionSchema>;
export type TrainModelInput = z.infer<typeof trainModelSchema>;
export type NoShowPredictionInput = z.infer<typeof noShowPredictionSchema>;
export type SurgeryPlanInput = z.infer<typeof surgeryPlanSchema>;
export type PriceEstimationInput = z.infer<typeof priceEstimationSchema>;
export type BedAvailabilityInput = z.infer<typeof bedAvailabilitySchema>;
export type DiseasePredictionInput = z.infer<typeof diseasePredictionSchema>;
