import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email").transform((value) => value.toLowerCase());
const passwordSchema = z
  .string()
  .trim()
  .min(6, "Password must be at least 6 characters");

export const registerDoctorSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailSchema,
  password: passwordSchema,
  specialization: z.string().trim().min(1, "Specialization is required"),
  experience: z.coerce.number().int().min(0, "Experience must be 0 or more"),
  consultationFee: z.coerce.number().min(0, "Consultation fee must be 0 or more"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1, "Password is required"),
});

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

export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type UpsertUnavailabilityInput = z.infer<typeof upsertUnavailabilitySchema>;
export type GetAvailabilityQuery = z.infer<typeof getAvailabilityQuerySchema>;
