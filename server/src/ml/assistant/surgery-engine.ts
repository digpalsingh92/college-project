/**
 * Surgery Engine
 *
 * Deterministic surgery planning — wraps the existing planSurgery() function.
 * Returns cost, duration, waiting time from dataset / ML models. No LLM.
 */

import { planSurgery } from "../surgery-planner.js";

export interface SurgeryEngineInput {
  surgeryType: string;
  patientAge: number;
  conditions?: string[];
}

export interface SurgeryEngineResult {
  surgeryType: string;
  estimatedCostRange: { min: number; max: number; avg: number };
  bedAvailability: { available: number; occupancyRate: number; level: "low" | "medium" | "high" };
  waitingDays: number;
  surgeryDuration: string;
  recoveryDays: number;
  confidence: number;
}

export async function runSurgeryEngine(input: SurgeryEngineInput): Promise<SurgeryEngineResult> {
  const result = await planSurgery({
    surgeryType: input.surgeryType,
    patientAge: input.patientAge,
    conditions: input.conditions,
  });

  return {
    surgeryType: result.surgeryType,
    estimatedCostRange: result.estimatedCostRange,
    bedAvailability: result.bedAvailability,
    waitingDays: result.waitingDays,
    surgeryDuration: result.surgeryDuration,
    recoveryDays: result.recoveryDays,
    confidence: result.confidence,
  };
}
