import { readFile } from "node:fs/promises";
import { saveNamedArtifact } from "./model-store.js";
import type { BedDepartmentStats, BedModel } from "./types.js";
import { datasetPath, findDatasetFiles } from "./dataset-discovery.js";

const MODEL_VERSION = "1.0.0";

const toNum = (v: string): number => {
  const n = Number((v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};

interface RawBedRow {
  department: string;
  totalBeds: number;
  freeBeds: number;
  totalIcuBeds: number;
  freeIcuBeds: number;
  totalAmount: number;
  staffOnDuty: number;
}

/**
 * bed_capacity_dataset_*.csv
 * Department,Total_Beds,Free_Beds,Total_ICU_Beds,Free_ICU_Beds,Total_Amount_of_Beds,Staff_On_Duty
 */
const parseBedCsv = async (filename: string): Promise<RawBedRow[]> => {
  const raw = await readFile(datasetPath(filename), "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      department: (cols[0] ?? "").trim(),
      totalBeds: toNum(cols[1]),
      freeBeds: toNum(cols[2]),
      totalIcuBeds: toNum(cols[3]),
      freeIcuBeds: toNum(cols[4]),
      totalAmount: toNum(cols[5]),
      staffOnDuty: toNum(cols[6]),
    };
  }).filter((r) => r.department);
};

export const trainBedModel = async (): Promise<BedModel> => {
  const datasetFiles = await findDatasetFiles([
    /^bed_capacity_dataset_.*\.csv$/i,
  ]);

  if (datasetFiles.length === 0) {
    throw new Error("No bed capacity datasets found. Add files named like bed_capacity_dataset_*.csv.");
  }

  const rowsByFile = await Promise.all(datasetFiles.map((filename) => parseBedCsv(filename)));
  const all = rowsByFile.flat();
  if (all.length === 0) {
    throw new Error("Bed datasets are empty. Cannot train bed model.");
  }

  // Average stats when same department appears in both datasets
  const grouped: Record<string, RawBedRow[]> = {};
  for (const row of all) {
    const key = row.department.toLowerCase();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  const avg = (arr: number[]): number =>
    arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

  const byDepartment: Record<string, BedDepartmentStats> = {};
  const departments: string[] = [];
  let totalBedsAll = 0;
  let freeBedsAll = 0;

  for (const [, rows] of Object.entries(grouped)) {
    const deptName = rows[0].department;
    const totalBeds = avg(rows.map((r) => r.totalBeds));
    const freeBeds = avg(rows.map((r) => r.freeBeds));
    const totalIcuBeds = avg(rows.map((r) => r.totalIcuBeds));
    const freeIcuBeds = avg(rows.map((r) => r.freeIcuBeds));
    const staffOnDuty = avg(rows.map((r) => r.staffOnDuty));

    const occupancyRate = totalBeds > 0
      ? Number(((totalBeds - freeBeds) / totalBeds).toFixed(4))
      : 0;
    const icuOccupancyRate = totalIcuBeds > 0
      ? Number(((totalIcuBeds - freeIcuBeds) / totalIcuBeds).toFixed(4))
      : 0;

    totalBedsAll += totalBeds;
    freeBedsAll += freeBeds;

    const stats: BedDepartmentStats = {
      department: deptName,
      totalBeds,
      freeBeds,
      totalIcuBeds,
      freeIcuBeds,
      occupancyRate,
      icuOccupancyRate,
      staffOnDuty,
    };

    byDepartment[deptName.toLowerCase()] = stats;
    departments.push(deptName);
  }

  const globalOccupancyRate = totalBedsAll > 0
    ? Number(((totalBedsAll - freeBedsAll) / totalBedsAll).toFixed(4))
    : 0;

  const model: BedModel = {
    version: MODEL_VERSION,
    trainedAt: new Date().toISOString(),
    datasetRecords: all.length,
    byDepartment,
    departments: departments.sort(),
    globalOccupancyRate,
  };

  await saveNamedArtifact("bed", model);
  return model;
};
