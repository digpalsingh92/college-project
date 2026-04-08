import { Request, Response } from "express";
import {
	doctorProfileUpdateSchema,
	doctorSignupSchema,
	loginSchema,
	patientSignupSchema,
} from "../schemas/auth.schema.js";
import {
	doctorLogin,
	doctorSignup,
	patientLogin,
	patientSignup,
	upsertDoctorProfile,
} from "../services/auth.services.js";
import { asyncHandler } from "../utils/async-handler.js";

export const patientSignupController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
	const input = patientSignupSchema.parse(req.body);
	const result = await patientSignup(input);
	res.status(201).json(result);
});

export const doctorSignupController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
	const input = doctorSignupSchema.parse(req.body);
	const result = await doctorSignup(input);
	res.status(201).json(result);
});

export const patientLoginController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
	const input = loginSchema.parse(req.body);
	const result = await patientLogin(input);
	res.status(200).json(result);
});

export const doctorLoginController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
	const input = loginSchema.parse(req.body);
	const result = await doctorLogin(input);
	res.status(200).json(result);
});

export const upsertDoctorProfileController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
	const input = doctorProfileUpdateSchema.parse(req.body);
	const result = await upsertDoctorProfile(input);
	res.status(200).json(result);
});