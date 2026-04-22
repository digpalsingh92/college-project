import { AppError } from "../utils/app-error.js";
import { loadNamedArtifact } from "./model-store.js";
import type { DiseaseModel, DiseasePredictionResult } from "./types.js";

let cached: DiseaseModel | null = null;

const tiny = 1e-9;

const ageBucket = (age: number): string => {
  if (age <= 18) return "0-18";
  if (age <= 35) return "19-35";
  if (age <= 55) return "36-55";
  if (age <= 70) return "56-70";
  return "71+";
};

const normalizeGender = (gender: string): string =>
  gender.trim().toLowerCase().startsWith("m") ? "male" : "female";

const normalizeLevel = (value: string): string => {
  const level = value.trim().toLowerCase();
  if (level === "low" || level === "high") return level;
  return "normal";
};

const getModel = async (): Promise<DiseaseModel> => {
  if (cached) return cached;
  try {
    cached = await loadNamedArtifact<DiseaseModel>("disease");
    return cached;
  } catch {
    throw new AppError("Disease model not trained yet. POST /predictions/train/disease first.", 400);
  }
};

export const reloadDiseaseModel = (): void => {
  cached = null;
};

export const predictDisease = async (input: {
  fever: boolean;
  cough: boolean;
  fatigue: boolean;
  difficultyBreathing: boolean;
  age: number;
  gender: string;
  bloodPressure: string;
  cholesterolLevel: string;
}): Promise<DiseasePredictionResult> => {
  const model = await getModel();

  const gender = normalizeGender(input.gender);
  const bp = normalizeLevel(input.bloodPressure);
  const cholesterol = normalizeLevel(input.cholesterolLevel);
  const ageGroup = ageBucket(input.age);
  const fever = input.fever ? "yes" : "no";
  const cough = input.cough ? "yes" : "no";
  const fatigue = input.fatigue ? "yes" : "no";
  const breathing = input.difficultyBreathing ? "yes" : "no";

  const scores = model.diseases.map((disease) => {
    const prior = model.priors[disease] ?? tiny;
    const lh = model.likelihoods[disease];

    const logScore =
      Math.log(prior) +
      Math.log(lh.fever[fever] ?? tiny) +
      Math.log(lh.cough[cough] ?? tiny) +
      Math.log(lh.fatigue[fatigue] ?? tiny) +
      Math.log(lh.difficultyBreathing[breathing] ?? tiny) +
      Math.log(lh.ageBucket[ageGroup] ?? tiny) +
      Math.log(lh.gender[gender] ?? tiny) +
      Math.log(lh.bloodPressure[bp] ?? tiny) +
      Math.log(lh.cholesterolLevel[cholesterol] ?? tiny);

    return { disease, logScore };
  });

  const maxLog = Math.max(...scores.map((item) => item.logScore));
  const expScores = scores.map((item) => ({
    disease: item.disease,
    score: Math.exp(item.logScore - maxLog),
  }));

  const total = expScores.reduce((sum, item) => sum + item.score, 0) || 1;
  const normalized = expScores
    .map((item) => ({
      disease: item.disease,
      confidence: Number((item.score / total).toFixed(4)),
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const top = normalized[0];

  return {
    disease: top.disease,
    confidence: top.confidence,
    topCandidates: normalized.slice(0, 3),
  };
};
