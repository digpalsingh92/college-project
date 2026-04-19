import { Request, Response } from "express";
import { getPatientAnalytics } from "../services/patient.service.js";
import { AppError } from "../utils/app-error.js";

export const getPatientsController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== "admin") {
    throw new AppError("Unauthorized", 401);
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const search = req.query.search ? String(req.query.search) : undefined;

  const result = await getPatientAnalytics({ page, limit, search });
  res.status(200).json(result);
};
