import { z } from "zod"

const emailSchema = z.string().trim().email('Invalid email address').toLowerCase();

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain one uppercase letter')
    .regex(/[a-z]/, 'Password must contain one lowercase letter')
    .regex(/[0-9]/, 'Password must contain one number');

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
});

const signupBaseSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: emailSchema,
    password: passwordSchema,
});

export const patientSignupSchema = signupBaseSchema;
export const doctorSignupSchema = signupBaseSchema;

export const doctorProfileSchema = z.object({
    specialization: z.string().trim().min(2, 'Specialization is required').max(100),
    experience: z.number().int().min(0, 'Experience cannot be negative'),
    consultationFee: z.number().positive('Consultation fee must be greater than 0'),
});

export const doctorProfileUpdateSchema = z.object({
    userId: z.string().uuid('Valid doctor user id is required'),
    ...doctorProfileSchema.shape,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PatientSignupInput = z.infer<typeof patientSignupSchema>;
export type DoctorSignupInput = z.infer<typeof doctorSignupSchema>;
export type DoctorProfileUpdateInput = z.infer<typeof doctorProfileUpdateSchema>;