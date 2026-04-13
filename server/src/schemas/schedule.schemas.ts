import { z } from "zod";

const timeSchema = z.string().trim().min(1);

const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const createScheduleSchema = z.object({
  doctorId: z.string().uuid("Valid doctor id is required"),
  dayOfWeek: dayOfWeekSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  slotDurationMinutes: z.number().int().min(10).max(120).optional(),
});

export const upsertUnavailabilitySchema = z.object({
  doctorId: z.string().uuid("Valid doctor id is required"),
  date: z.string().trim(),
  startTime: timeSchema,
  endTime: timeSchema,
  reason: z.string().trim().max(200).optional(),
});

export const getAvailabilityQuerySchema = z.object({
  date: z.string().trim(),
  slotDurationMinutes: z.coerce.number().int().min(10).max(120).optional(),
});

export const updateScheduleSchema = z.object({
  dayOfWeek: dayOfWeekSchema.optional(),
  startTime: timeSchema,
  endTime: timeSchema,
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type UpsertUnavailabilityInput = z.infer<typeof upsertUnavailabilitySchema>;
export type GetAvailabilityQuery = z.infer<typeof getAvailabilityQuerySchema>;
