import { Request, Response } from "express";
import {
  getDoctorProfile,
  getAllDoctors,
  getDoctorById,
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
  const { id } = req.params;
  const doctor = await getDoctorById(id);
  res.status(200).json({ doctor });
};
