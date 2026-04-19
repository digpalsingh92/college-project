import { AppError } from "../utils/app-error.js";
import { loadNamedArtifact } from "./model-store.js";
import type { BedDepartmentStats, BedModel } from "./types.js";

let cached: BedModel | null = null;

const getModel = async (): Promise<BedModel> => {
  if (cached) return cached;
  try {
    cached = await loadNamedArtifact<BedModel>("bed");
    return cached;
  } catch {
    throw new AppError("Bed model not trained yet. POST /predictions/train/bed first.", 400);
  }
};

export const reloadBedModel = (): void => {
  cached = null;
};

const occupancyLevel = (rate: number): "low" | "medium" | "high" => {
  if (rate >= 0.85) return "high";
  if (rate >= 0.6) return "medium";
  return "low";
};

export const estimateBedAvailability = async (input: {
  department?: string;
}): Promise<{
  department: string;
  totalBeds: number;
  freeBeds: number;
  occupancyRate: number;
  level: "low" | "medium" | "high";
  icuAvailable: number;
  staffOnDuty: number;
}> => {
  const model = await getModel();

  let stats: BedDepartmentStats | undefined;

  if (input.department) {
    const key = input.department.toLowerCase();
    stats = model.byDepartment[key];

    // Fuzzy match if exact not found
    if (!stats) {
      for (const [k, v] of Object.entries(model.byDepartment)) {
        if (k.includes(key) || key.includes(k)) {
          stats = v;
          break;
        }
      }
    }
  }

  if (!stats) {
    // Return global aggregated stats
    const allDepts = Object.values(model.byDepartment);
    const totalBeds = allDepts.reduce((s, d) => s + d.totalBeds, 0);
    const freeBeds = allDepts.reduce((s, d) => s + d.freeBeds, 0);
    const icuAvailable = allDepts.reduce((s, d) => s + d.freeIcuBeds, 0);
    const staffOnDuty = allDepts.reduce((s, d) => s + d.staffOnDuty, 0);
    const occupancyRate = totalBeds > 0 ? (totalBeds - freeBeds) / totalBeds : 0;

    return {
      department: input.department ?? "All Departments",
      totalBeds,
      freeBeds,
      occupancyRate: Number(occupancyRate.toFixed(4)),
      level: occupancyLevel(occupancyRate),
      icuAvailable,
      staffOnDuty,
    };
  }

  return {
    department: stats.department,
    totalBeds: stats.totalBeds,
    freeBeds: stats.freeBeds,
    occupancyRate: stats.occupancyRate,
    level: occupancyLevel(stats.occupancyRate),
    icuAvailable: stats.freeIcuBeds,
    staffOnDuty: stats.staffOnDuty,
  };
};
