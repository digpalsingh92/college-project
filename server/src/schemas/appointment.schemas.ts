import { z } from "zod";

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid("Valid doctor id is required"),
  date: z.string().trim(),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  patientAge: z.number().int().min(0).max(120).optional(),
  remarks: z.string().trim().max(500).optional(),
});

export const updateAppointmentByDoctorSchema = z.object({
  status: z.enum(["booked", "completed", "no_show", "cancelled"]),
  remarks: z.string().trim().max(500).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentByDoctorInput = z.infer<typeof updateAppointmentByDoctorSchema>;
