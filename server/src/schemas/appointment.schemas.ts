import { z } from "zod";

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid("Valid doctor id is required"),
  date: z.string().trim(),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
