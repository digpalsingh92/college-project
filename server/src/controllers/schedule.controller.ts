import { Request, Response } from "express";
import { z } from "zod";
import {
  createScheduleSchema,
  getAvailabilityQuerySchema,
  upsertUnavailabilitySchema,
} from "../schemas/schedule.schemas.js";
import {
  addDoctorUnavailability,
  createDoctorSchedule,
  getDoctorAvailability,
} from "../services/schedule.service.js";

export const createDoctorScheduleController = async (req: Request, res: Response): Promise<void> => {
  const input = createScheduleSchema.parse(req.body);
  const result = await createDoctorSchedule(input);
  res.status(201).json(result);
};

export const addDoctorUnavailabilityController = async (req: Request, res: Response): Promise<void> => {
  const input = upsertUnavailabilitySchema.parse(req.body);
  const result = await addDoctorUnavailability(input);
  res.status(201).json(result);
};

export const getDoctorAvailabilityController = async (req: Request, res: Response): Promise<void> => {
  const params = z.object({ doctorId: z.string().uuid("Valid doctor id is required") }).parse(req.params);
  const query = getAvailabilityQuerySchema.parse(req.query);
  const result = await getDoctorAvailability(params.doctorId, query);
  res.status(200).json(result);
};
