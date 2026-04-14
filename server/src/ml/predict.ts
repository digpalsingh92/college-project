import { RecommendationModel } from "./features.js";

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const normalizeDepartment = (value: string): string => value.trim().toLowerCase();

const ageBucket = (age: number): string => {
  if (age < 20) return "under_20";
  if (age < 40) return "20s_30s";
  if (age < 60) return "40s_50s";
  return "60_plus";
};

const previousNoShowsBucket = (value: number): string => {
  if (value <= 0) return "0";
  if (value === 1) return "1";
  if (value === 2) return "2";
  return "3_plus";
};

export interface WaitPredictionInput {
  department: string;
  scheduledHour: number;
}

export interface NoShowPredictionInput {
  smsReceived: "Yes" | "No";
  previousNoShows: number;
  age: number;
}

export const getWaitStats = (model: RecommendationModel, input: WaitPredictionInput) => {
  const department = normalizeDepartment(input.department);
  const exactKey = `${department}|${input.scheduledHour}`;
  const exact = model.waitByDepartmentHour[exactKey];
  const fallback = model.waitByDepartment[department];
  const selected = exact ?? fallback;

  if (!selected) {
    return {
      avgWaitingMinutes: 0,
      p90WaitingMinutes: 0,
      supportingSamples: 0,
      avgAge: model.globalAge,
    };
  }

  return {
    avgWaitingMinutes: selected.avgWaitingMinutes,
    p90WaitingMinutes: selected.p90WaitingMinutes,
    supportingSamples: selected.count,
    avgAge: selected.avgAge || model.globalAge,
  };
};

export const getAgeEstimate = (model: RecommendationModel, department: string, scheduledHour: number): number => {
  const normalizedDepartment = normalizeDepartment(department);
  const departmentHourKey = `${normalizedDepartment}|${scheduledHour}`;
  return model.ageByDepartmentHour[departmentHourKey] ?? model.ageByDepartment[normalizedDepartment] ?? model.globalAge;
};

export const predictNoShowProbability = (
  model: RecommendationModel,
  input: NoShowPredictionInput
): { probability: number; supportingSamples: number } => {
  const key = [input.smsReceived, previousNoShowsBucket(input.previousNoShows), ageBucket(input.age)].join("|");
  const exact = model.noShowBySignal[key];

  const fallbacks = [
    [input.smsReceived, previousNoShowsBucket(input.previousNoShows), "*"].join("|"),
    [input.smsReceived, "*", ageBucket(input.age)].join("|"),
    [input.smsReceived, "*", "*"].join("|"),
    ["*", previousNoShowsBucket(input.previousNoShows), ageBucket(input.age)].join("|"),
    ["*", previousNoShowsBucket(input.previousNoShows), "*"].join("|"),
    ["*", "*", ageBucket(input.age)].join("|"),
  ];

  const fallback = fallbacks.map((candidate) => model.noShowBySignal[candidate]).find((candidate) => Boolean(candidate));
  const selected = exact ?? fallback;

  if (!selected) {
    return {
      probability: model.globalNoShowRate.noShowRate,
      supportingSamples: model.globalNoShowRate.count,
    };
  }

  const global = model.globalNoShowRate.noShowRate;
  const smoothing = 12;
  const blended = (selected.noShowRate * selected.count + global * smoothing) / (selected.count + smoothing);

  return {
    probability: Number(clamp(blended, 0.02, 0.98).toFixed(3)),
    supportingSamples: selected.count,
  };
};

export const scoreSlot = ({
  estimatedWaitMinutes,
  maxWaitMinutes,
  minWaitMinutes,
  noShowProbability,
}: {
  estimatedWaitMinutes: number;
  maxWaitMinutes: number;
  minWaitMinutes: number;
  noShowProbability: number;
}): number => {
  const span = Math.max(maxWaitMinutes - minWaitMinutes, 1);
  const normalizedWaitTime = 1 + (estimatedWaitMinutes - minWaitMinutes) / span;
  return Number((((1 / normalizedWaitTime) * 0.7 + (1 - noShowProbability) * 0.3)).toFixed(3));
};
