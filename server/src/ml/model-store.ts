import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TrainedPredictionModel } from "./types.js";

export const MODEL_ARTIFACT_PATH = path.resolve(
  process.cwd(),
  "src",
  "ml",
  "artifacts",
  "waiting_resource_model.json"
);

export const saveModelArtifact = async (model: TrainedPredictionModel): Promise<void> => {
  await mkdir(path.dirname(MODEL_ARTIFACT_PATH), { recursive: true });
  await writeFile(MODEL_ARTIFACT_PATH, JSON.stringify(model, null, 2), "utf-8");
};

export const loadModelArtifact = async (): Promise<TrainedPredictionModel> => {
  const raw = await readFile(MODEL_ARTIFACT_PATH, "utf-8");
  return JSON.parse(raw) as TrainedPredictionModel;
};
