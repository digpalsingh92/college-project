import { Request, Response } from "express";
import { z } from "zod";
import {
  createScheduleSchema,
  getAvailabilityQuerySchema,
  updateScheduleSchema,
  upsertUnavailabilitySchema,
} from "../schemas/schedule.schemas.js";
import {
  addDoctorUnavailability,
  createDoctorSchedule,
  deleteDoctorSchedule,
  deleteDoctorUnavailability,
  getDoctorAvailability,
  getDoctorSchedules,
  getDoctorUnavailabilities,
  updateDoctorSchedule,
} from "../services/schedule.service.js";

const doctorIdParamSchema = z.object({ doctorId: z.string().uuid("Valid doctor id is required") });
const scheduleIdParamSchema = z.object({ scheduleId: z.string().uuid("Valid schedule id is required") });
const unavailabilityIdParamSchema = z.object({ unavailabilityId: z.string().uuid("Valid id is required") });

export const createDoctorScheduleController = async (req: Request, res: Response): Promise<void> => {
  const input = createScheduleSchema.parse(req.body);
  const result = await createDoctorSchedule(input);
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
  if (!doctorId) { res.status(401).json({ message: "Unauthorized" }); return; }
  const input = updateScheduleSchema.parse(req.body);
  const result = await updateDoctorSchedule(scheduleId, doctorId, input);
  res.status(200).json(result);
};

export const deleteDoctorScheduleController = async (req: Request, res: Response): Promise<void> => {
  const { scheduleId } = scheduleIdParamSchema.parse(req.params);
  const doctorId = req.user?.id;
  if (!doctorId) { res.status(401).json({ message: "Unauthorized" }); return; }
  const result = await deleteDoctorSchedule(scheduleId, doctorId);
  res.status(200).json(result);
};

export const addDoctorUnavailabilityController = async (req: Request, res: Response): Promise<void> => {
  const input = upsertUnavailabilitySchema.parse(req.body);
  const result = await addDoctorUnavailability(input);
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
  if (!doctorId) { res.status(401).json({ message: "Unauthorized" }); return; }
  const result = await deleteDoctorUnavailability(unavailabilityId, doctorId);
  res.status(200).json(result);
};

export const getDoctorAvailabilityController = async (req: Request, res: Response): Promise<void> => {
  const params = z.object({ doctorId: z.string().uuid("Valid doctor id is required") }).parse(req.params);
  const query = getAvailabilityQuerySchema.parse(req.query);
  const result = await getDoctorAvailability(params.doctorId, query);
  res.status(200).json(result);
};
