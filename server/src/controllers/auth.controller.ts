import { Request, Response } from "express";
import { loginByRole, registerDoctor, registerPatient } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import {
  loginSchema,
  registerDoctorSchema,
  registerPatientSchema,
} from "../schemas/auth.schemas.js";

const parseBody = <T>(schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: unknown } }, body: unknown): T => {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError("Validation failed", 400, result.error);
  }

  return result.data as T;
};

export const doctorRegister = async (req: Request, res: Response): Promise<void> => {
	const input = parseBody(registerDoctorSchema, req.body);
	const result = await registerDoctor(input);
	res.status(201).json(result);
};

export const patientRegister = async (req: Request, res: Response): Promise<void> => {
	const input = parseBody(registerPatientSchema, req.body);
	const result = await registerPatient(input);
	res.status(201).json(result);
};

export const doctorLogin = async (req: Request, res: Response): Promise<void> => {
	const input = parseBody(loginSchema, req.body);
	const result = await loginByRole(input, "doctor");
	res.status(200).json(result);
};

export const patientLogin = async (req: Request, res: Response): Promise<void> => {
	const input = parseBody(loginSchema, req.body);
	const result = await loginByRole(input, "patient");
	res.status(200).json(result);
};