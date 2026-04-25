import { readFile } from "node:fs/promises";
import { saveNamedArtifact } from "./model-store.js";
import type { DiseaseLikelihoods, DiseaseModel } from "./types.js";
import { datasetPath, findDatasetFiles } from "./dataset-discovery.js";

const MODEL_VERSION = "1.0.0";

const AGE_BUCKETS = ["0-18", "19-35", "36-55", "56-70", "71+"] as const;
const YES_NO_VALUES = ["yes", "no"] as const;
const BP_VALUES = ["low", "normal", "high"] as const;
const CHOLESTEROL_VALUES = ["low", "normal", "high"] as const;
const GENDER_VALUES = ["male", "female"] as const;

interface DiseaseRow {
  disease: string;
  fever: boolean;
  cough: boolean;
  fatigue: boolean;
  difficultyBreathing: boolean;
  age: number;
  gender: string;
  bloodPressure: string;
  cholesterolLevel: string;
  outcome: string;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextIsQuote = line[i + 1] === '"';
      if (inQuotes && nextIsQuote) {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeDisease(value: string): string {
  return value.replace(/^"|"$/g, "").trim();
}

function toBool(value: string): boolean {
  return value.trim().toLowerCase() === "yes";
}

function ageBucket(age: number): string {
  if (age <= 18) return "0-18";
  if (age <= 35) return "19-35";
  if (age <= 55) return "36-55";
  if (age <= 70) return "56-70";
  return "71+";
}

function cleanGender(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("m") ? "male" : "female";
}

function cleanLevel(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "high" || normalized === "low") return normalized;
  return "normal";
}

async function parseDiseaseDataset(filename: string): Promise<DiseaseRow[]> {
  const raw = await readFile(datasetPath(filename), "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines
    .slice(1)
    .map((line) => parseCsvLine(line))
    .map((cols) => ({
      disease: normalizeDisease(cols[0] ?? ""),
      fever: toBool(cols[1] ?? "No"),
      cough: toBool(cols[2] ?? "No"),
      fatigue: toBool(cols[3] ?? "No"),
      difficultyBreathing: toBool(cols[4] ?? "No"),
      age: Number(cols[5]) || 0,
      gender: cleanGender(cols[6] ?? "female"),
      bloodPressure: cleanLevel(cols[7] ?? "normal"),
      cholesterolLevel: cleanLevel(cols[8] ?? "normal"),
      outcome: (cols[9] ?? "").trim().toLowerCase(),
    }))
    .filter((row) => row.disease.length > 0);
}

function initCounter(values: readonly string[]): Record<string, number> {
  return Object.fromEntries(values.map((value) => [value, 0]));
}

function toLikelihoods(counts: Record<string, number>, total: number): Record<string, number> {
  const keys = Object.keys(counts);
  const k = keys.length;
  return Object.fromEntries(
    keys.map((key) => [key, Number(((counts[key] + 1) / (total + k)).toFixed(6))])
  );
}

export const trainDiseaseModel = async (): Promise<DiseaseModel> => {
  const diseaseFiles = await findDatasetFiles([/^disease_symptom_profile_dataset_.*\.csv$/i]);
  const rows = (await Promise.all(diseaseFiles.map((filename) => parseDiseaseDataset(filename)))).flat();
  if (rows.length === 0) {
    throw new Error("Disease dataset is empty. Cannot train disease model.");
  }

  const confirmedRows = rows.filter((row) => row.outcome === "positive");
  const trainingRows = confirmedRows.length > 0 ? confirmedRows : rows;

  const byDisease = new Map<string, DiseaseRow[]>();
  for (const row of trainingRows) {
    const group = byDisease.get(row.disease) ?? [];
    group.push(row);
    byDisease.set(row.disease, group);
  }

  const diseases = [...byDisease.keys()].sort();
  const priors: Record<string, number> = {};
  const likelihoods: Record<string, DiseaseLikelihoods> = {};
  const totalRows = trainingRows.length;

  for (const disease of diseases) {
    const group = byDisease.get(disease) ?? [];
    const groupTotal = group.length;

    const feverCounts = initCounter(YES_NO_VALUES);
    const coughCounts = initCounter(YES_NO_VALUES);
    const fatigueCounts = initCounter(YES_NO_VALUES);
    const breathingCounts = initCounter(YES_NO_VALUES);
    const ageCounts = initCounter(AGE_BUCKETS);
    const genderCounts = initCounter(GENDER_VALUES);
    const bpCounts = initCounter(BP_VALUES);
    const cholesterolCounts = initCounter(CHOLESTEROL_VALUES);

    for (const row of group) {
      feverCounts[row.fever ? "yes" : "no"] += 1;
      coughCounts[row.cough ? "yes" : "no"] += 1;
      fatigueCounts[row.fatigue ? "yes" : "no"] += 1;
      breathingCounts[row.difficultyBreathing ? "yes" : "no"] += 1;
      ageCounts[ageBucket(row.age)] += 1;
      genderCounts[row.gender] += 1;
      bpCounts[row.bloodPressure] += 1;
      cholesterolCounts[row.cholesterolLevel] += 1;
    }

    priors[disease] = Number(((groupTotal + 1) / (totalRows + diseases.length)).toFixed(6));
    likelihoods[disease] = {
      fever: toLikelihoods(feverCounts, groupTotal),
      cough: toLikelihoods(coughCounts, groupTotal),
      fatigue: toLikelihoods(fatigueCounts, groupTotal),
      difficultyBreathing: toLikelihoods(breathingCounts, groupTotal),
      ageBucket: toLikelihoods(ageCounts, groupTotal),
      gender: toLikelihoods(genderCounts, groupTotal),
      bloodPressure: toLikelihoods(bpCounts, groupTotal),
      cholesterolLevel: toLikelihoods(cholesterolCounts, groupTotal),
    };
  }

  const model: DiseaseModel = {
    version: MODEL_VERSION,
    trainedAt: new Date().toISOString(),
    datasetRecords: rows.length,
    confirmedRecords: confirmedRows.length,
    diseases,
    priors,
    likelihoods,
  };

  await saveNamedArtifact("disease", model);
  return model;
};
