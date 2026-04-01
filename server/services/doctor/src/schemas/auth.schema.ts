import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain one uppercase letter')
    .regex(/[a-z]/, 'Password must contain one lowercase letter')
    .regex(/[0-9]/, 'Password must contain one number'),
  specialization: z.string().trim().min(2, 'Specialization is required'),
  licenseNumber: z.string().trim().min(3, 'License number is required'),
  phone: z.string().trim().optional(),
});

export const registerDoctorSchema = createDoctorSchema;

export const loginDoctorSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});


export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;
export type LoginDoctorInput = z.infer<typeof loginDoctorSchema>;
