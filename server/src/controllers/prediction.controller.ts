import { Request, Response } from "express";
import {
  resourceAllocationPredictionSchema,
  trainModelSchema,
  waitingTimePredictionSchema,
  noShowPredictionSchema,
  surgeryPlanSchema,
  priceEstimationSchema,
  bedAvailabilitySchema,
  diseasePredictionSchema,
} from "../schemas/prediction.schemas.js";
import {
  predictResourceAllocation,
  predictWaitingTime,
  reloadPredictionModel,
} from "../ml/inference.js";
import { trainPredictionModel } from "../ml/trainer.js";
import { predictNoShow } from "../ml/noshow-inference.js";
import { planSurgery } from "../ml/surgery-planner.js";
import { estimatePrice } from "../ml/price-inference.js";
import { estimateBedAvailability } from "../ml/bed-inference.js";
import { analyzeSlots } from "../ml/slots-analysis.js";
import { getQueueStatus as getQueueStatusML } from "../ml/queue-status.js";
import { getRecommendations as getRecommendationsML } from "../ml/recommendations.js";
import { trainNoShowModel } from "../ml/noshow-trainer.js";
import { trainPriceModel } from "../ml/price-trainer.js";
import { trainBedModel } from "../ml/bed-trainer.js";
import { trainDiseaseModel } from "../ml/disease-trainer.js";
import { predictDisease } from "../ml/disease-inference.js";
import { AppError } from "../utils/app-error.js";

// ── Existing controllers ──

export const waitingTimePredictionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = waitingTimePredictionSchema.parse(req.body);
  const result = await predictWaitingTime(input);

  res.status(200).json({
    message: "Waiting time prediction generated",
    data: result,
  });
};

export const resourceAllocationPredictionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = resourceAllocationPredictionSchema.parse(req.body);
  const result = await predictResourceAllocation(input);

  res.status(200).json({
    message: "Resource allocation prediction generated",
    data: result,
  });
};

export const trainPredictionModelController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = trainModelSchema.parse(req.body ?? {});
  const result = await trainPredictionModel(input.datasetPath);

  res.status(200).json({
    message: "Model trained successfully",
    data: {
      modelVersion: result.version,
      trainedAt: result.trainedAt,
      datasetRecords: result.datasetRecords,
      llmInsightsGenerated: result.llmInsights.generated,
      llmModel: result.llmInsights.model,
    },
  });
};

export const reloadPredictionModelController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await reloadPredictionModel();

  res.status(200).json({
    message: "Model reloaded successfully",
    data: result,
  });
};

// ── New controllers ──

export const slotsAnalysisController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const doctorId = req.query.doctorId as string;
  const date = req.query.date as string;

  if (!doctorId || !date) {
    throw new AppError("doctorId and date query parameters are required", 400);
  }

  const result = await analyzeSlots(doctorId, date);
  res.status(200).json({ message: "Slot analysis complete", data: result });
};

export const noShowPredictionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = noShowPredictionSchema.parse(req.body);
  const result = await predictNoShow(input);
  res.status(200).json({ message: "No-show prediction generated", data: result });
};

export const surgeryPlanController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = surgeryPlanSchema.parse(req.body);
  const result = await planSurgery({
    surgeryType: input.surgeryType,
    patientAge: input.patientAge,
    conditions: input.conditions,
  });
  res.status(200).json({ message: "Surgery plan generated", data: result });
};

export const priceEstimationController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = priceEstimationSchema.parse(req.body);
  const result = await estimatePrice(input);
  res.status(200).json({ message: "Price estimation complete", data: result });
};

export const bedAvailabilityController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = bedAvailabilitySchema.parse(req.body);
  const result = await estimateBedAvailability(input);
  res.status(200).json({ message: "Bed availability estimated", data: result });
};

export const diseasePredictionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = diseasePredictionSchema.parse(req.body);
  const result = await predictDisease(input);
  res.status(200).json({ message: "Disease prediction generated", data: result });
};

export const queueStatusController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const doctorId = req.query.doctorId as string;
  if (!doctorId) {
    throw new AppError("doctorId query parameter is required", 400);
  }
  const result = await getQueueStatusML(doctorId);
  res.status(200).json({ message: "Queue status retrieved", data: result });
};

export const recommendationsController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await getRecommendationsML();
  res.status(200).json({ message: "Recommendations generated", data: result });
};

// ── Training controllers ──

export const trainNoShowController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await trainNoShowModel();
  res.status(200).json({
    message: "No-show model trained successfully",
    data: {
      version: result.version,
      trainedAt: result.trainedAt,
      datasetRecords: result.datasetRecords,
      globalNoShowRate: result.globalNoShowRate,
    },
  });
};

export const trainPriceController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await trainPriceModel();
  res.status(200).json({
    message: "Price model trained successfully",
    data: {
      version: result.version,
      trainedAt: result.trainedAt,
      datasetRecords: result.datasetRecords,
      procedureCount: result.procedures.length,
    },
  });
};

export const trainBedController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await trainBedModel();
  res.status(200).json({
    message: "Bed model trained successfully",
    data: {
      version: result.version,
      trainedAt: result.trainedAt,
      datasetRecords: result.datasetRecords,
      departmentCount: result.departments.length,
      globalOccupancyRate: result.globalOccupancyRate,
    },
  });
};

export const trainDiseaseController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await trainDiseaseModel();
  res.status(200).json({
    message: "Disease model trained successfully",
    data: {
      version: result.version,
      trainedAt: result.trainedAt,
      datasetRecords: result.datasetRecords,
      confirmedRecords: result.confirmedRecords,
      diseaseCount: result.diseases.length,
    },
  });
};
