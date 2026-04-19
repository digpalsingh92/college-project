import { Request, Response } from "express";
import {
  createAppointmentSchema,
  updateAppointmentByDoctorSchema,
} from "../schemas/appointment.schemas.js";
import {
  createAppointment,
  getAppointmentsForDoctor,
  getAppointmentsForPatient,
  cancelAppointmentById,
  completeAppointmentById,
  updateAppointmentByDoctor,
  getAdminAppointmentPredictionInsights,
  getPredictedSlotsForDoctor,
} from "../services/appointment.service.js";
import { AppError } from "../utils/app-error.js";

export const createAppointmentController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError("Please login before creating appointment", 401);
  }

  const input = createAppointmentSchema.parse(req.body);
  const result = await createAppointment({
    ...input,
    patientId: req.user.id,
  });
  res.status(201).json({ appointment: result });
};

export const getPatientAppointmentsController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const result = await getAppointmentsForPatient(req.user.id, page, limit);
  res.status(200).json(result);
};

export const getDoctorAppointmentsController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const result = await getAppointmentsForDoctor(req.user.id, page, limit);
  res.status(200).json(result);
};

export const getPredictedSlotsController = async (req: Request, res: Response): Promise<void> => {
  const doctorId = Array.isArray(req.query.doctorId) ? req.query.doctorId[0] : req.query.doctorId;
  const date = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;

  if (!doctorId || !date) {
    throw new AppError("doctorId and date are required", 400);
  }

  const result = await getPredictedSlotsForDoctor(String(doctorId), String(date));
  res.status(200).json(result);
};

export const getAdminAppointmentInsightsController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await getAdminAppointmentPredictionInsights();
  res.status(200).json(result);
};

export const cancelAppointmentController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const appointment = await cancelAppointmentById(id, req.user.id, req.user.role);
  res.status(200).json({ appointment });
};

export const completeAppointmentController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const appointment = await completeAppointmentById(id, req.user.id);
  res.status(200).json({ appointment });
};

export const updateAppointmentByDoctorController = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = updateAppointmentByDoctorSchema.parse(req.body);
  const appointment = await updateAppointmentByDoctor(id, req.user.id, input);
  res.status(200).json({ appointment });
};
