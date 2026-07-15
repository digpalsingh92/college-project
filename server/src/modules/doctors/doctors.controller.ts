import { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  getAllDoctors,
  getDoctorById,
  getDoctorAnalytics,
  createDoctorSchedule,
  getDoctorSchedules,
  updateDoctorSchedule,
  deleteDoctorSchedule,
  getDoctorUnavailabilities,
  deleteDoctorUnavailability,
  addDoctorUnavailability,
  getDoctorAvailability,
} from "./doctors.service.js";

// Validation schemas for controller parameters
const doctorIdParamSchema = z.object({ doctorId: z.string().uuid("Valid doctor id is required") });
const scheduleIdParamSchema = z.object({ scheduleId: z.string().uuid("Valid schedule id is required") });
const unavailabilityIdParamSchema = z.object({ unavailabilityId: z.string().uuid("Valid id is required") });

// ── Auth Controllers ──

export const doctorRegister = async (req: Request, res: Response): Promise<void> => {
  const result = await registerDoctor(req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: "Doctor registered successfully.",
    data: result,
  });
};

export const doctorLogin = async (req: Request, res: Response): Promise<void> => {
  const result = await loginDoctor(req.body);
  sendSuccess(res, {
    statusCode: 200,
    message: "Doctor login successful.",
    data: result,
  });
};

// ── Profile and Analytics Controllers ──

export const getDoctorProfileController = async (req: Request, res: Response): Promise<void> => {
  const doctorId = req.user?.id;
  if (!doctorId) {
    throw new AppError("Unauthorized", 401);
  }
  const result = await getDoctorProfile(doctorId);
  res.status(200).json(result);
};

export const getAllDoctorsController = async (req: Request, res: Response): Promise<void> => {
  const result = await getAllDoctors();
  res.status(200).json(result);
};

export const getDoctorByIdController = async (req: Request, res: Response): Promise<void> => {
  const params = doctorIdParamSchema.parse(req.params);
  const result = await getDoctorById(params.doctorId);
  res.status(200).json(result);
};

export const getDoctorAnalyticsController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== "admin") {
    throw new AppError("Unauthorized", 401);
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const search = req.query.search ? String(req.query.search) : undefined;

  const result = await getDoctorAnalytics({ page, limit, search });
  res.status(200).json(result);
};

// ── Schedule and Unavailability Controllers ──

export const createDoctorScheduleController = async (req: Request, res: Response): Promise<void> => {
  const result = await createDoctorSchedule(req.body);
  res.status(201).json(result);
};

export const getDoctorSchedulesController = async (req: Request, res: Response): Promise<void> => {
  const { doctorId } = doctorIdParamSchema.parse(req.params);
  const result = await getDoctorSchedules(doctorId);
  res.status(200).json({ schedules: result });
};

export const updateDoctorScheduleController = async (req: Request, res: Response): Promise<void> => {
  const { scheduleId } = scheduleIdParamSchema.parse(req.params);
  const doctorId = req.user?.id;
  if (!doctorId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const result = await updateDoctorSchedule(scheduleId, doctorId, req.body);
  res.status(200).json(result);
};

export const deleteDoctorScheduleController = async (req: Request, res: Response): Promise<void> => {
  const { scheduleId } = scheduleIdParamSchema.parse(req.params);
  const doctorId = req.user?.id;
  if (!doctorId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const result = await deleteDoctorSchedule(scheduleId, doctorId);
  res.status(200).json(result);
};

export const addDoctorUnavailabilityController = async (req: Request, res: Response): Promise<void> => {
  const result = await addDoctorUnavailability(req.body);
  res.status(201).json(result);
};

export const getDoctorUnavailabilitiesController = async (req: Request, res: Response): Promise<void> => {
  const { doctorId } = doctorIdParamSchema.parse(req.params);
  const result = await getDoctorUnavailabilities(doctorId);
  res.status(200).json({ unavailabilities: result });
};

export const deleteDoctorUnavailabilityController = async (req: Request, res: Response): Promise<void> => {
  const { unavailabilityId } = unavailabilityIdParamSchema.parse(req.params);
  const doctorId = req.user?.id;
  if (!doctorId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const result = await deleteDoctorUnavailability(unavailabilityId, doctorId);
  res.status(200).json(result);
};

export const getDoctorAvailabilityController = async (req: Request, res: Response): Promise<void> => {
  const params = doctorIdParamSchema.parse(req.params);
  const result = await getDoctorAvailability(params.doctorId, req.query as any);
  res.status(200).json(result);
};
