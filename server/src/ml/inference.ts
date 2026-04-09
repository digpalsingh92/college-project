import { AppError } from "../utils/app-error.js";
import { loadModelArtifact } from "./model-store.js";
import { BucketStats, ResourceRecommendation, TrainedPredictionModel } from "./types.js";

let cachedModel: TrainedPredictionModel | null = null;

const getModel = async (): Promise<TrainedPredictionModel> => {
  if (cachedModel) {
    return cachedModel;
  }

  try {
    cachedModel = await loadModelArtifact();
    return cachedModel;
  } catch (_error) {
    throw new AppError(
      "Prediction model not found. Train the model first with: npm run ml:train",
      400
    );
  }
};

const confidenceFromCount = (count: number): "low" | "medium" | "high" => {
  if (count >= 80) {
    return "high";
  }
  if (count >= 25) {
    return "medium";
  }
  return "low";
};

export const predictWaitingTime = async (input: {
  department: string;
  appointmentType: string;
  scheduledHour: number;
  reminderSent: "Yes" | "No";
  previousNoShows: number;
}) => {
  const model = await getModel();

  const level1Key = `${input.department}|${input.appointmentType}|${input.scheduledHour}|${input.reminderSent}`;
  const level2Key = `${input.department}|${input.appointmentType}`;

  const level1 = model.waitingTimeModel.byDepartmentAppointmentTypeHourReminder[level1Key];
  const level2 = model.waitingTimeModel.byDepartmentAppointmentType[level2Key];
  const level3 = model.waitingTimeModel.byDepartment[input.department];
  const selected = level1 ?? level2 ?? level3 ?? model.waitingTimeModel.global;

  const previousNoShowPenalty = Math.min(input.previousNoShows * 2, 16);
  const predictedWaitingTimeMinutes = Math.round(selected.avgWaitingMinutes + previousNoShowPenalty);

  return {
    predictedWaitingTimeMinutes,
    p90WaitingTimeMinutes: Math.round(selected.p90WaitingMinutes),
    confidence: confidenceFromCount(selected.count),
    supportingSamples: selected.count,
    noShowRisk: Number(selected.noShowRate.toFixed(3)),
    cancelledRisk: Number(selected.cancelRate.toFixed(3)),
    trainedAt: model.trainedAt,
    modelVersion: model.version,
  };
};

const scaleResourceByExpectedDemand = (
  base: ResourceRecommendation,
  expectedAppointments?: number
): ResourceRecommendation => {
  if (!expectedAppointments || expectedAppointments <= 0) {
    return base;
  }

  const scale = expectedAppointments / Math.max(base.observations, 1);

  return {
    ...base,
    recommendedDoctors: Math.max(1, Math.ceil(base.recommendedDoctors * scale)),
    recommendedNurses: Math.max(1, Math.ceil(base.recommendedNurses * scale)),
    recommendedFrontDesk: Math.max(1, Math.ceil(base.recommendedFrontDesk * scale)),
  };
};

export const predictResourceAllocation = async (input: {
  department: string;
  scheduledHour: number;
  expectedAppointments?: number;
}) => {
  const model = await getModel();
  const key = `${input.department}|${input.scheduledHour}`;
  const exact = model.resourceAllocationModel.byDepartmentHour[key];

  const fallback = Object.entries(model.resourceAllocationModel.byDepartmentHour)
    .filter(([entryKey]) => entryKey.startsWith(`${input.department}|`))
    .map(([, value]) => value)
    .sort((a, b) => b.observations - a.observations)[0];

  const globalFallback = Object.values(model.resourceAllocationModel.byDepartmentHour).sort(
    (a, b) => b.observations - a.observations
  )[0];

  const selected = exact ?? fallback ?? globalFallback;

  if (!selected) {
    throw new AppError("Resource model has no observations", 400);
  }

  const scaled = scaleResourceByExpectedDemand(selected, input.expectedAppointments);

  return {
    department: input.department,
    scheduledHour: input.scheduledHour,
    expectedAppointments: input.expectedAppointments ?? null,
    recommendedDoctors: scaled.recommendedDoctors,
    recommendedNurses: scaled.recommendedNurses,
    recommendedFrontDesk: scaled.recommendedFrontDesk,
    riskLevel: scaled.riskLevel,
    avgWaitingMinutes: scaled.avgWaitingMinutes,
    noShowRate: Number(scaled.noShowRate.toFixed(3)),
    cancelRate: Number(scaled.cancelRate.toFixed(3)),
    supportingSamples: scaled.observations,
    trainedAt: model.trainedAt,
    modelVersion: model.version,
  };
};

export const reloadPredictionModel = async () => {
  cachedModel = await loadModelArtifact();
  return {
    modelVersion: cachedModel.version,
    trainedAt: cachedModel.trainedAt,
    datasetRecords: cachedModel.datasetRecords,
  };
};
