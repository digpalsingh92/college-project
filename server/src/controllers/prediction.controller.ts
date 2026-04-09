import { Request, Response } from "express";
import {
  resourceAllocationPredictionSchema,
  trainModelSchema,
  waitingTimePredictionSchema,
} from "../schemas/prediction.schemas.js";
import {
  predictResourceAllocationService,
  predictWaitingTimeService,
  reloadPredictionModelService,
  trainPredictionModelService,
} from "../services/prediction.service.js";

export const waitingTimePredictionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = waitingTimePredictionSchema.parse(req.body);
  const result = await predictWaitingTimeService(input);

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
  const result = await predictResourceAllocationService(input);

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
  const result = await trainPredictionModelService(input.datasetPath);

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
  const result = await reloadPredictionModelService();

  res.status(200).json({
    message: "Model reloaded successfully",
    data: result,
  });
};
