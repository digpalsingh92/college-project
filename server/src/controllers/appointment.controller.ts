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
  const appointments = await getAppointmentsForPatient(req.user.id);
  res.status(200).json({ appointments });
};

export const getDoctorAppointmentsController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const appointments = await getAppointmentsForDoctor(req.user.id);
  res.status(200).json({ appointments });
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
