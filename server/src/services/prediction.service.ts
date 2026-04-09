import {
  predictResourceAllocation,
  predictWaitingTime,
  reloadPredictionModel,
} from "../ml/inference.js";
import { trainPredictionModel } from "../ml/trainer.js";
import {
  ResourceAllocationPredictionInput,
  WaitingTimePredictionInput,
} from "../schemas/prediction.schemas.js";

export const predictWaitingTimeService = async (input: WaitingTimePredictionInput) => {
  return predictWaitingTime(input);
};

export const predictResourceAllocationService = async (
  input: ResourceAllocationPredictionInput
) => {
  return predictResourceAllocation(input);
};

export const trainPredictionModelService = async (datasetPath?: string) => {
  return trainPredictionModel(datasetPath);
};

export const reloadPredictionModelService = async () => {
  return reloadPredictionModel();
};
