import { z } from "zod";

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

export type WaitingTimePredictionInput = z.infer<typeof waitingTimePredictionSchema>;
export type ResourceAllocationPredictionInput = z.infer<typeof resourceAllocationPredictionSchema>;
export type TrainModelInput = z.infer<typeof trainModelSchema>;
