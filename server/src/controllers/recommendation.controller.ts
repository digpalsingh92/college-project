import { Request, Response } from "express";
import { z } from "zod";
import { getDoctorSlotRecommendations } from "../services/recommendationService.js";

const recommendationParamsSchema = z.object({
  doctorId: z.string().uuid("Valid doctor id is required"),
});

const recommendationQuerySchema = z.object({
  date: z.string().trim().min(1, "Date is required"),
});

export const getDoctorSlotRecommendationsController = async (req: Request, res: Response): Promise<void> => {
  const { doctorId } = recommendationParamsSchema.parse(req.params);
  const { date } = recommendationQuerySchema.parse(req.query);

  const result = await getDoctorSlotRecommendations({
    doctorId,
    date,
    user: req.user ?? null,
  });

  res.status(200).json(result);
};
