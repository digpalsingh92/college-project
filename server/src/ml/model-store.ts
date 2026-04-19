import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TrainedPredictionModel } from "./types.js";

const ARTIFACTS_DIR = path.resolve(process.cwd(), "src", "ml", "artifacts");

// ── legacy single-model helpers (backward compat) ──

export const MODEL_ARTIFACT_PATH = path.join(ARTIFACTS_DIR, "waiting_resource_model.json");

export const saveModelArtifact = async (model: TrainedPredictionModel): Promise<void> => {
  await mkdir(path.dirname(MODEL_ARTIFACT_PATH), { recursive: true });
  await writeFile(MODEL_ARTIFACT_PATH, JSON.stringify(model, null, 2), "utf-8");
};

export const loadModelArtifact = async (): Promise<TrainedPredictionModel> => {
  const raw = await readFile(MODEL_ARTIFACT_PATH, "utf-8");
  return JSON.parse(raw) as TrainedPredictionModel;
};

// ── generic named artifact store ──

export type ModelName = "waiting_resource" | "noshow" | "price" | "bed";

const artifactPath = (name: ModelName): string =>
  path.join(ARTIFACTS_DIR, `${name}_model.json`);

export const saveNamedArtifact = async <T>(name: ModelName, data: T): Promise<void> => {
  await mkdir(ARTIFACTS_DIR, { recursive: true });
  await writeFile(artifactPath(name), JSON.stringify(data, null, 2), "utf-8");
};

export const loadNamedArtifact = async <T>(name: ModelName): Promise<T> => {
  const raw = await readFile(artifactPath(name), "utf-8");
  return JSON.parse(raw) as T;
};
