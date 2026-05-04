/**
 * Response Validator
 *
 * Cross-validates intent vs response content to prevent hallucination leakage.
 */

import type { AssistantIntent } from "./intent-classifier.js";

export interface StructuredResponse {
  intent: AssistantIntent;
  message: string;
  data: Record<string, unknown> | null;
  confidence: number;
  suggestions: string[];
}

const SURGERY_FIELDS = ["surgeryType", "surgeryDuration", "recoveryDays", "estimatedCostRange", "bedAvailability"];

/**
 * Validate that the response matches the declared intent.
 * Returns the response if valid, or a corrected/sanitized response if invalid.
 */
export function validateResponse(response: StructuredResponse): StructuredResponse {
  const { intent, data } = response;

  if (!data || typeof data !== "object") return response;

  // Rule: disease_info intent should NOT contain surgery fields
  if (intent === "disease_info") {
    const hasSurgeryFields = SURGERY_FIELDS.some((field) => field in data);
    if (hasSurgeryFields) {
      console.warn(`[Validator] disease_info response contains surgery fields — sanitizing.`);
      const sanitized = { ...data };
      for (const field of SURGERY_FIELDS) {
        delete sanitized[field];
      }
      return { ...response, data: sanitized };
    }
  }

  // Rule: surgery_plan intent should have cost/duration data
  if (intent === "surgery_plan") {
    const hasRequired = "estimatedCostRange" in data || "surgeryDuration" in data || "surgeryType" in data;
    if (!hasRequired) {
      console.warn(`[Validator] surgery_plan response missing required fields — flagging low confidence.`);
      return { ...response, confidence: Math.min(response.confidence, 0.3) };
    }
  }

  // Rule: bed_availability should have bed data
  if (intent === "bed_availability") {
    const hasBeds = "totalBeds" in data || "freeBeds" in data || "occupancyRate" in data;
    if (!hasBeds) {
      console.warn(`[Validator] bed_availability response missing bed data.`);
      return { ...response, confidence: Math.min(response.confidence, 0.3) };
    }
  }

  return response;
}
