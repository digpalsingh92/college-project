import { readFile } from "node:fs/promises";
import { saveNamedArtifact } from "./model-store.js";
import type { PriceBucket, PriceModel } from "./types.js";
import { datasetPath, findDatasetFiles } from "./dataset-discovery.js";

const MODEL_VERSION = "1.0.0";
const USD_TO_INR = 83;

const toNum = (v: string): number => {
  const cleaned = v.replace(/[$,"\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

/**
 * price_hospital_dataset_*.csv
 * Columns: Patient_ID,Age,Gender,Condition,Procedure,Cost,Length_of_Stay,Readmission,Outcome,Satisfaction
 */
const parseHospitalPricing = async (filename: string): Promise<{ procedure: string; cost: number }[]> => {
  const raw = await readFile(datasetPath(filename), "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      procedure: (cols[4] ?? "").trim(),
      cost: toNum(cols[5] ?? "0"),
    };
  }).filter((r) => r.procedure && r.cost > 0);
};

/**
 * price_inpatient_dataset_*.csv
 * Columns: DRG Definition,Provider Id,Provider Name,...,Average Covered Charges,Average Total Payments,Average Medicare Payments
 */
const parseInpatientCharges = async (filename: string): Promise<{ procedure: string; cost: number }[]> => {
  const raw = await readFile(datasetPath(filename), "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line) => {
    // CSV may have commas inside quoted fields. Simple split works here because
    // the DRG Definition field uses " - " but has no embedded commas.
    const cols = line.split(",");
    const drg = (cols[0] ?? "").replace(/^"|"$/g, "").trim();
    // Extract just the procedure description (after the DRG code)
    const procedure = drg.replace(/^\d+\s*-\s*/, "").trim();
    const costStr = cols[cols.length - 3] ?? "0"; // Average Covered Charges
    return {
      procedure,
      cost: toNum(costStr),
    };
  }).filter((r) => r.procedure && r.cost > 0);
};

const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

const usdToInr = (usd: number): number => Math.round(usd * USD_TO_INR);

export const trainPriceModel = async (): Promise<PriceModel> => {
  const hospitalPricingFiles = await findDatasetFiles([/^price_hospital_dataset_.*\.csv$/i]);
  const inpatientChargeFiles = await findDatasetFiles([/^price_inpatient_dataset_.*\.csv$/i]);

  const [pricingSets, inpatientSets] = await Promise.all([
    Promise.all(hospitalPricingFiles.map((filename) => parseHospitalPricing(filename))),
    Promise.all(inpatientChargeFiles.map((filename) => parseInpatientCharges(filename))),
  ]);

  const all = [...pricingSets.flat(), ...inpatientSets.flat()];
  if (all.length === 0) {
    throw new Error("Price datasets are empty. Cannot train price model.");
  }

  // Group by normalized procedure name
  const groups: Record<string, { originalName: string; costs: number[] }> = {};
  for (const row of all) {
    const key = normalize(row.procedure);
    if (!groups[key]) {
      groups[key] = { originalName: row.procedure, costs: [] };
    }
    // Source pricing datasets are USD-based; convert once during training.
    groups[key].costs.push(usdToInr(row.cost));
  }

  const byProcedure: Record<string, PriceBucket> = {};
  const procedures: string[] = [];

  for (const [key, group] of Object.entries(groups)) {
    const costs = group.costs.sort((a, b) => a - b);
    const bucket: PriceBucket = {
      procedure: group.originalName,
      count: costs.length,
      min: Math.round(costs[0]),
      max: Math.round(costs[costs.length - 1]),
      avg: Math.round(costs.reduce((s, c) => s + c, 0) / costs.length),
      median: Math.round(median(costs)),
    };
    byProcedure[key] = bucket;
    procedures.push(group.originalName);
  }

  const model: PriceModel = {
    version: MODEL_VERSION,
    trainedAt: new Date().toISOString(),
    currency: "INR",
    datasetRecords: all.length,
    byProcedure,
    procedures: procedures.sort(),
  };

  await saveNamedArtifact("price", model);
  return model;
};
