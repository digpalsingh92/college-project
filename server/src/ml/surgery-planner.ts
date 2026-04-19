import { estimatePrice } from "./price-inference.js";
import { estimateBedAvailability } from "./bed-inference.js";
import type { SurgeryPlanResult } from "./types.js";

/**
 * Lookup tables for surgery metadata.
 * These are clinical heuristics — not ML — kept intentionally simple.
 */
const SURGERY_META: Record<
  string,
  { durationHours: string; recoveryDays: number; relatedDepartment: string; procedure: string }
> = {
  knee_replacement: {
    durationHours: "2-3 hours",
    recoveryDays: 42,
    relatedDepartment: "orthopedics",
    procedure: "Knee Replacement",
  },
  cataract: {
    durationHours: "30-45 min",
    recoveryDays: 7,
    relatedDepartment: "ophthalmology",
    procedure: "Cataract Surgery",
  },
  appendectomy: {
    durationHours: "1-2 hours",
    recoveryDays: 14,
    relatedDepartment: "general surgery",
    procedure: "Appendectomy",
  },
  hip_replacement: {
    durationHours: "2-4 hours",
    recoveryDays: 56,
    relatedDepartment: "orthopedics",
    procedure: "Hip Replacement",
  },
  hernia_repair: {
    durationHours: "1-2 hours",
    recoveryDays: 21,
    relatedDepartment: "general surgery",
    procedure: "Hernia Repair",
  },
  cardiac_bypass: {
    durationHours: "4-6 hours",
    recoveryDays: 84,
    relatedDepartment: "cardiac surgery",
    procedure: "Cardiac Bypass",
  },
  angioplasty: {
    durationHours: "1-3 hours",
    recoveryDays: 14,
    relatedDepartment: "cardiac surgery",
    procedure: "Angioplasty",
  },
  ct_scan_and_medication: {
    durationHours: "1-2 hours",
    recoveryDays: 30,
    relatedDepartment: "neurology",
    procedure: "CT Scan and Medication",
  },
};

const DEFAULT_META = {
  durationHours: "1-3 hours",
  recoveryDays: 21,
  relatedDepartment: "general surgery",
  procedure: "General Surgery",
};

export const planSurgery = async (input: {
  surgeryType: string;
  patientAge: number;
  conditions?: string[];
}): Promise<SurgeryPlanResult> => {
  const key = input.surgeryType.toLowerCase().replace(/[\s-]+/g, "_");
  const meta = SURGERY_META[key] ?? { ...DEFAULT_META, procedure: input.surgeryType };

  // Get price estimation
  const price = await estimatePrice({ procedure: meta.procedure });

  // Get bed availability for related department
  const bed = await estimateBedAvailability({ department: meta.relatedDepartment });

  // Waiting days heuristic: based on bed occupancy + queue
  let waitingDays = 3;
  if (bed.level === "high") waitingDays = 14;
  else if (bed.level === "medium") waitingDays = 7;

  // Age adjustment: older patients may need more preparation
  if (input.patientAge >= 65) {
    waitingDays += 3;
  }

  // Conditions adjustment
  const conditionsCount = input.conditions?.length ?? 0;
  if (conditionsCount >= 2) waitingDays += 2;

  // Recovery adjustment for age
  let recoveryDays = meta.recoveryDays;
  if (input.patientAge >= 65) recoveryDays = Math.round(recoveryDays * 1.3);
  if (conditionsCount >= 2) recoveryDays = Math.round(recoveryDays * 1.15);

  // Confidence score
  let confidence = 0.75;
  if (price.count >= 20) confidence += 0.1;
  if (price.count >= 50) confidence += 0.05;
  if (SURGERY_META[key]) confidence += 0.05;
  confidence = Math.min(0.95, confidence);

  return {
    surgeryType: input.surgeryType,
    estimatedCostRange: { min: price.min, max: price.max, avg: price.avg },
    bedAvailability: {
      available: bed.freeBeds,
      occupancyRate: bed.occupancyRate,
      level: bed.level,
    },
    waitingDays,
    surgeryDuration: meta.durationHours,
    recoveryDays,
    confidence: Number(confidence.toFixed(2)),
  };
};
