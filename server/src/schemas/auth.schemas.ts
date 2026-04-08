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

export const registerPatientSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	email: emailSchema,
	password: passwordSchema,
});

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().trim().min(1, "Password is required"),
});

export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;
export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
