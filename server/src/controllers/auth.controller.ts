import { Request, Response } from "express";
import { loginByRole, registerDoctor, registerPatient } from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const doctorRegister = async (req: Request, res: Response): Promise<void> => {
	const result = await registerDoctor(req.body);
	sendSuccess(res, {
		statusCode: 201,
		message: "Doctor registered successfully.",
		data: result,
	});
};

export const patientRegister = async (req: Request, res: Response): Promise<void> => {
	const result = await registerPatient(req.body);
	sendSuccess(res, {
		statusCode: 201,
		message: "Patient registered successfully.",
		data: result,
	});
};

export const doctorLogin = async (req: Request, res: Response): Promise<void> => {
	const result = await loginByRole(req.body, "doctor");
	sendSuccess(res, {
		statusCode: 200,
		message: "Doctor login successful.",
		data: result,
	});
};

export const patientLogin = async (req: Request, res: Response): Promise<void> => {
	const result = await loginByRole(req.body, "patient");
	sendSuccess(res, {
		statusCode: 200,
		message: "Patient login successful.",
		data: result,
	});
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
	const result = await loginByRole(req.body, "admin");
	sendSuccess(res, {
		statusCode: 200,
		message: "Admin login successful.",
		data: result,
	});
};