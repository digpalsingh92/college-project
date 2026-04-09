import path from "node:path";
import { config } from "../config/config.js";
import { parseDatasetCsv } from "./csv.js";
import { saveModelArtifact } from "./model-store.js";
import {
  BucketStats,
  DatasetRow,
  ResourceRecommendation,
  TrainedPredictionModel,
} from "./types.js";

const MODEL_VERSION = "1.0.0";
const MISTRAL_MODEL = "mistral-small-latest";

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[clamp(index, 0, sorted.length - 1)];
};

const buildStats = (rows: DatasetRow[]): BucketStats => {
  const waitTimes = rows.map((row) => row.waitingTimeMinutes);
  const count = rows.length;
  const noShows = rows.filter((row) => row.appointmentStatus === "No-Show").length;
  const cancelled = rows.filter((row) => row.appointmentStatus === "Cancelled").length;

  return {
    count,
    avgWaitingMinutes: Number(average(waitTimes).toFixed(2)),
    p90WaitingMinutes: Number(percentile(waitTimes, 90).toFixed(2)),
    noShowRate: Number((noShows / Math.max(count, 1)).toFixed(4)),
    cancelRate: Number((cancelled / Math.max(count, 1)).toFixed(4)),
  };
};

const groupRows = (rows: DatasetRow[], keyBuilder: (row: DatasetRow) => string): Record<string, DatasetRow[]> => {
  return rows.reduce<Record<string, DatasetRow[]>>((acc, row) => {
    const key = keyBuilder(row);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {});
};

const buildResourceRecommendation = (rows: DatasetRow[]): ResourceRecommendation => {
  const stats = buildStats(rows);
  const expectedShowUpLoad = stats.count * (1 - stats.noShowRate * 0.6);
  const congestionFactor = stats.avgWaitingMinutes / 60;
  const loadScore = expectedShowUpLoad * (1 + congestionFactor * 0.25);

  const recommendedDoctors = clamp(Math.ceil(loadScore / 30), 1, 12);
  const recommendedNurses = clamp(Math.ceil(loadScore / 20), 1, 18);
  const recommendedFrontDesk = clamp(Math.ceil(loadScore / 45), 1, 8);

  let riskLevel: ResourceRecommendation["riskLevel"] = "low";
  if (stats.avgWaitingMinutes >= 100 || stats.noShowRate >= 0.35) {
    riskLevel = "high";
  } else if (stats.avgWaitingMinutes >= 70 || stats.noShowRate >= 0.2) {
    riskLevel = "medium";
  }

  return {
    observations: stats.count,
    avgWaitingMinutes: stats.avgWaitingMinutes,
    noShowRate: stats.noShowRate,
    cancelRate: stats.cancelRate,
    recommendedDoctors,
    recommendedNurses,
    recommendedFrontDesk,
    riskLevel,
  };
};

const buildMistralPrompt = (model: TrainedPredictionModel): string => {
  const departmentSummary = Object.entries(model.waitingTimeModel.byDepartment)
    .map(([department, stats]) => {
      return `${department}: avg_wait=${stats.avgWaitingMinutes}, p90=${stats.p90WaitingMinutes}, no_show_rate=${stats.noShowRate}`;
    })
    .slice(0, 12)
    .join("\n");

  return [
    "You are helping a hospital operations team.",
    "Based on these aggregated stats, return a JSON array of 3 short operational recommendations.",
    "Each recommendation object must have keys: title, why, action.",
    "Keep each field below 120 characters.",
    "Stats:",
    departmentSummary,
  ].join("\n");
};

const fetchMistralInsights = async (model: TrainedPredictionModel): Promise<TrainedPredictionModel["llmInsights"]> => {
  if (!config.mistralApiKey) {
    return {
      provider: "mistral",
      model: MISTRAL_MODEL,
      generated: false,
      notes: ["MISTRAL_API_KEY not provided. Deterministic model artifact generated without LLM insights."],
    };
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.mistralApiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Return valid JSON only.",
        },
        {
          role: "user",
          content: buildMistralPrompt(model),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return {
      provider: "mistral",
      model: MISTRAL_MODEL,
      generated: false,
      notes: [`Mistral call failed: ${response.status}`],
      rawResponse: errorBody,
    };
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawResponse = payload.choices?.[0]?.message?.content ?? "{}";
  return {
    provider: "mistral",
    model: MISTRAL_MODEL,
    generated: true,
    notes: ["Operational recommendations generated with Mistral from aggregated training statistics."],
    rawResponse,
  };
};

const buildBaseModel = (rows: DatasetRow[], datasetPath: string): TrainedPredictionModel => {
  const byDepartment = groupRows(rows, (row) => row.department);
  const byDepartmentType = groupRows(rows, (row) => `${row.department}|${row.appointmentType}`);
  const byDeptTypeHourReminder = groupRows(
    rows,
    (row) => `${row.department}|${row.appointmentType}|${row.scheduledHour}|${row.reminderSent}`
  );
  const byDepartmentHour = groupRows(rows, (row) => `${row.department}|${row.scheduledHour}`);

  return {
    version: MODEL_VERSION,
    trainedAt: new Date().toISOString(),
    datasetPath,
    datasetRecords: rows.length,
    waitingTimeModel: {
      global: buildStats(rows),
      byDepartment: Object.fromEntries(Object.entries(byDepartment).map(([key, bucket]) => [key, buildStats(bucket)])),
      byDepartmentAppointmentType: Object.fromEntries(
        Object.entries(byDepartmentType).map(([key, bucket]) => [key, buildStats(bucket)])
      ),
      byDepartmentAppointmentTypeHourReminder: Object.fromEntries(
        Object.entries(byDeptTypeHourReminder).map(([key, bucket]) => [key, buildStats(bucket)])
      ),
    },
    resourceAllocationModel: {
      byDepartmentHour: Object.fromEntries(
        Object.entries(byDepartmentHour).map(([key, bucket]) => [key, buildResourceRecommendation(bucket)])
      ),
    },
    llmInsights: {
      provider: "mistral",
      model: MISTRAL_MODEL,
      generated: false,
      notes: ["Training in progress"],
    },
  };
};

export const trainPredictionModel = async (datasetPath?: string): Promise<TrainedPredictionModel> => {
  const resolvedDatasetPath = datasetPath
    ? path.resolve(datasetPath)
    : path.resolve(process.cwd(), "src", "Datasets", "healthcare_appointment_no_show_wait_time.csv");

  const rows = await parseDatasetCsv(resolvedDatasetPath);
  if (rows.length === 0) {
    throw new Error("Dataset is empty. Unable to train prediction model.");
  }

  const baseModel = buildBaseModel(rows, resolvedDatasetPath);
  const llmInsights = await fetchMistralInsights(baseModel);

  const trainedModel: TrainedPredictionModel = {
    ...baseModel,
    llmInsights,
  };

  await saveModelArtifact(trainedModel);
  return trainedModel;
};
