import { AppError } from "../utils/app-error.js";
import { loadNamedArtifact } from "./model-store.js";
import type { NoShowModel } from "./types.js";

let cached: NoShowModel | null = null;

const getModel = async (): Promise<NoShowModel> => {
  if (cached) return cached;
  try {
    cached = await loadNamedArtifact<NoShowModel>("noshow");
    return cached;
  } catch {
    throw new AppError("No-show model not trained yet. POST /predictions/train/no-show first.", 400);
  }
};

export const reloadNoShowModel = (): void => {
  cached = null;
};

const ageBucket = (age: number): string => {
  if (age <= 18) return "0-18";
  if (age <= 35) return "19-35";
  if (age <= 55) return "36-55";
  return "56+";
};

const daysDiffBucket = (diff: number): string => {
  if (diff <= 0) return "same_day";
  if (diff <= 3) return "1-3_days";
  if (diff <= 7) return "4-7_days";
  if (diff <= 14) return "8-14_days";
  return "15+_days";
};

export const predictNoShow = async (input: {
  age: number;
  gender: string;
  daysDiff: number;
  smsReceived: boolean;
  conditions?: string[];
}): Promise<{ probability: number; willShow: boolean }> => {
  const model = await getModel();

  const aBucket = ageBucket(input.age);
  const dBucket = daysDiffBucket(input.daysDiff);
  const smsKey = input.smsReceived ? "yes" : "no";
  const genderKey = input.gender.toUpperCase().startsWith("M") ? "M" : "F";

  // Try composite key first, then fallback through dimensions
  const compositeKey = `${aBucket}|${genderKey}|${smsKey}|${dBucket}`;
  const composite = model.byComposite[compositeKey];

  if (composite && composite.count >= 10) {
    return {
      probability: Number(composite.noShowRate.toFixed(4)),
      willShow: composite.noShowRate < 0.5,
    };
  }

  // Weighted average of individual dimensions
  const ageRate = model.byAgeBucket[aBucket]?.noShowRate ?? model.globalNoShowRate;
  const genderRate = model.byGender[genderKey]?.noShowRate ?? model.globalNoShowRate;
  const smsRate = model.bySmsReceived[smsKey]?.noShowRate ?? model.globalNoShowRate;
  const daysRate = model.byDaysDiffBucket[dBucket]?.noShowRate ?? model.globalNoShowRate;

  // Weights: days-diff and SMS are stronger predictors
  const probability = Number(
    (ageRate * 0.15 + genderRate * 0.1 + smsRate * 0.35 + daysRate * 0.4).toFixed(4)
  );

  // Conditions penalty: chronic conditions increase no-show slightly
  const conditionPenalty = (input.conditions?.length ?? 0) * 0.02;
  const adjustedProbability = Math.min(1, probability + conditionPenalty);

  return {
    probability: Number(adjustedProbability.toFixed(4)),
    willShow: adjustedProbability < 0.5,
  };
};
