/**
 * Disease Engine
 *
 * Two modes:
 * 1. Name-based: If a disease name is provided → return static info (symptoms, severity, precautions).
 * 2. Symptom-based: If symptoms are provided → run disease prediction model.
 *
 * NEVER returns surgery-related fields.
 */

import { predictDisease } from "../disease-inference.js";
import { lookupDisease, buildDiseasePayload, type ExtractedEntities } from "./entity-normalizer.js";

export interface DiseaseEngineResult {
  mode: "name_lookup" | "symptom_prediction";
  disease: string;
  confidence: number;
  symptoms: string[];
  severity: "mild" | "moderate" | "severe";
  requiresSurgery: boolean;
  precautions: string[];
  topCandidates?: Array<{ disease: string; confidence: number }>;
}

export async function runDiseaseEngine(entities: ExtractedEntities): Promise<DiseaseEngineResult> {
  // Mode 1: Name-based lookup
  if (entities.diseaseName) {
    const entry = lookupDisease(entities.diseaseName);
    if (entry) {
      return {
        mode: "name_lookup",
        disease: entry.canonical,
        confidence: 0.95,
        symptoms: entry.symptoms,
        severity: entry.severity,
        requiresSurgery: entry.requiresSurgery,
        precautions: entry.precautions,
      };
    }
  }

  // Mode 2: Symptom-based prediction
  const symptoms = entities.symptoms ?? [];
  if (symptoms.length > 0) {
    try {
      const payload = buildDiseasePayload(entities);
      const prediction = await predictDisease(payload);

      return {
        mode: "symptom_prediction",
        disease: prediction.disease,
        confidence: prediction.confidence,
        symptoms,
        severity: prediction.confidence > 0.7 ? "moderate" : "mild",
        requiresSurgery: false,
        precautions: ["Consult a doctor for accurate diagnosis", "Do not self-medicate"],
        topCandidates: prediction.topCandidates,
      };
    } catch {
      // Disease model not trained — fall back to generic
    }
  }

  // Fallback: disease name given but not in our map
  if (entities.diseaseName) {
    return {
      mode: "name_lookup",
      disease: entities.diseaseName,
      confidence: 0.5,
      symptoms: [],
      severity: "moderate",
      requiresSurgery: false,
      precautions: ["Please consult a healthcare professional for accurate diagnosis and treatment"],
    };
  }

  return {
    mode: "symptom_prediction",
    disease: "Unknown",
    confidence: 0,
    symptoms: [],
    severity: "mild",
    requiresSurgery: false,
    precautions: ["Please provide more symptoms or a specific disease name for better results"],
  };
}
