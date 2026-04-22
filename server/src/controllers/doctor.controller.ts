import { Request, Response } from "express";
import {
  getDoctorProfile,
  getAllDoctors,
  getDoctorById,
  getDoctorAnalytics,
} from "../services/doctor.service.js";
import { AppError } from "../utils/app-error.js";

export const getDoctorProfileController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const doctor = await getDoctorProfile(req.user.id);
  res.status(200).json({ doctor });
};

export const getAllDoctorsController = async (_req: Request, res: Response): Promise<void> => {
  const doctors = await getAllDoctors();
  res.status(200).json({ doctors });
};

export const getDoctorByIdController = async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const doctor = await getDoctorById(id);
  res.status(200).json({ doctor });
};

export const getDoctorAnalyticsController = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const result = await getDoctorAnalytics({ page, limit, search });
  res.status(200).json(result);
};
