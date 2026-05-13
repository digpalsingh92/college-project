/**
 * Conversational Formatter Layer
 *
 * The final layer that transforms raw backend results into
 * human-friendly, contextual, conversational responses.
 *
 * Responsibilities:
 *   1. Template-based response generation per intent
 *   2. Tone adaptation (urgent/empathetic/informative/friendly)
 *   3. Multi-section response assembly from multiple backend calls
 *   4. Graceful degradation when data is missing
 */

import type {
  AssistantEntities,
  AssistantIntent,
  BackendResult,
  FormattedResponse,
  MedicalReasoning,
  ResponseTone,
  ActionPlan,
} from "@/services/assistant/types";

// ── Helpers ──

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return undefined;
}

function toObj(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function unwrapData(raw: unknown): Record<string, unknown> | null {
  const obj = toObj(raw);
  if (!obj) return null;
  // Many backend responses wrap the real payload under .data
  const inner = toObj(obj.data);
  return inner ?? obj;
}

function formatCurrency(amount: unknown): string | undefined {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return undefined;
  if (amount >= 100000) {
    const lakhs = Math.round((amount / 100000) * 10) / 10;
    return `₹${lakhs} lakh`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ── Tone prefixes ──

const TONE_PREFIX: Record<ResponseTone, string> = {
  urgent: "⚠️ ",
  empathetic: "",
  informative: "",
  friendly: "",
};

const TONE_EMERGENCY_HEADER = "🚨 **Emergency Detected**\n\n";

// ── Intent-specific formatters ──

function formatEmergency(
  results: BackendResult[],
  entities: AssistantEntities,
  _reasoning: MedicalReasoning
): string {
  const parts: string[] = [TONE_EMERGENCY_HEADER];

  parts.push("This appears to be a medical emergency. Please take the following steps immediately:");
  parts.push("");
  parts.push("1. **Call emergency services** (112 / local emergency number)");
  parts.push("2. **Do not move the patient** unless in immediate danger");
  parts.push("3. **Keep the patient calm** and monitor breathing");

  if (entities.symptoms && entities.symptoms.length > 0) {
    parts.push("");
    parts.push(`Reported symptoms: ${entities.symptoms.join(", ")}`);
  }

  // Add bed availability if we got supplementary data
  const bedResult = results.find((r) => r.key.includes("bed") && r.ok);
  if (bedResult) {
    const data = unwrapData(bedResult.data);
    if (data) {
      const freeBeds = data.freeBeds ?? data.available;
      if (typeof freeBeds === "number") {
        parts.push("");
        parts.push(`🏥 Nearest hospital beds available: **${freeBeds}** — proceed to emergency department.`);
      }
    }
  }

  return parts.join("\n");
}

function formatSurgeryPlan(
  results: BackendResult[],
  entities: AssistantEntities
): string {
  const primary = results.find((r) => r.key === "surgery-plan" && r.ok);
  const data = primary ? unwrapData(primary.data) : null;
  const surgery = entities.surgeryType ?? "the requested procedure";

  const parts: string[] = [];
  parts.push(`Here is a comprehensive surgery plan for **${surgery}**:`);
  parts.push("");

  if (data) {
    // Cost
    const costRange = toObj(data.estimatedCostRange);
    if (costRange) {
      const min = formatCurrency(costRange.min);
      const max = formatCurrency(costRange.max);
      const avg = formatCurrency(costRange.avg);
      if (min && max) {
        parts.push(`💰 **Estimated Cost**: ${min} – ${max}${avg ? ` (avg: ${avg})` : ""}`);
      }
    }

    // Wait time
    if (typeof data.waitingDays === "number") {
      parts.push(`⏱️ **Expected Wait**: ${data.waitingDays} days`);
    }

    // Recovery
    if (typeof data.recoveryDays === "number") {
      parts.push(`🔄 **Recovery Time**: approximately ${data.recoveryDays} days`);
    }

    // Surgery duration
    if (typeof data.surgeryDuration === "string") {
      parts.push(`⏰ **Surgery Duration**: ${data.surgeryDuration}`);
    }

    // Confidence
    if (typeof data.confidence === "number") {
      parts.push(`📊 **Prediction Confidence**: ${(data.confidence * 100).toFixed(0)}%`);
    }
  } else {
    parts.push("I couldn't retrieve detailed planning data at this moment. Please try again shortly.");
  }

  // Supplementary bed data
  const bedResult = results.find((r) => r.key.includes("bed") && r.ok);
  if (bedResult) {
    const bedData = unwrapData(bedResult.data);
    if (bedData) {
      parts.push("");
      const freeBeds = bedData.freeBeds ?? bedData.available;
      const dept = bedData.department ?? entities.department;
      if (typeof freeBeds === "number") {
        parts.push(`🛏️ **Bed Availability**${dept ? ` (${dept})` : ""}: ${freeBeds} beds currently available`);
      }
    }
  }

  return parts.join("\n");
}

function formatPrice(
  results: BackendResult[],
  entities: AssistantEntities
): string {
  const primary = results.find((r) => r.key === "price" && r.ok);
  const data = primary ? unwrapData(primary.data) : null;
  const procedure = entities.surgeryType ?? "the requested procedure";

  if (!data) {
    return `I couldn't find pricing data for ${procedure} at this time. Please try again or specify the procedure name.`;
  }

  const parts: string[] = [];

  const min = formatCurrency(data.min as number | undefined);
  const max = formatCurrency(data.max as number | undefined);
  const avg = formatCurrency(data.avg as number | undefined);
  const median = formatCurrency(data.median as number | undefined);

  if (min && max) {
    parts.push(`The estimated cost for **${data.procedure ?? procedure}** ranges from **${min}** to **${max}**.`);
  } else {
    parts.push(`Here is the pricing information for **${data.procedure ?? procedure}**:`);
  }

  if (avg) parts.push(`📊 **Average**: ${avg}`);
  if (median) parts.push(`📊 **Median**: ${median}`);

  if (typeof data.count === "number" && data.count > 0) {
    parts.push(`Based on **${data.count}** historical records.`);
  }

  // Supplementary surgery plan data
  const surgeryResult = results.find((r) => r.key === "price-surgery" && r.ok);
  if (surgeryResult) {
    const surgData = unwrapData(surgeryResult.data);
    if (surgData && typeof surgData.recoveryDays === "number") {
      parts.push("");
      parts.push(`🔄 Expected recovery: approximately ${surgData.recoveryDays} days.`);
    }
  }

  return parts.join("\n");
}

function formatBed(
  results: BackendResult[],
  entities: AssistantEntities,
  reasoning: MedicalReasoning
): string {
  const primary = results.find((r) => r.key === "bed" && r.ok);
  const data = primary ? unwrapData(primary.data) : null;

  if (!data) {
    return "I couldn't retrieve bed availability at this moment. Please try again shortly.";
  }

  const dept = data.department ?? entities.department ?? reasoning.inferredDepartment ?? "General";
  const parts: string[] = [];

  parts.push(`Here is the current bed availability for **${dept}**:`);
  parts.push("");

  if (typeof data.totalBeds === "number") {
    parts.push(`🛏️ **Total Beds**: ${data.totalBeds}`);
  }
  if (typeof data.freeBeds === "number") {
    parts.push(`✅ **Available**: ${data.freeBeds}`);
  }
  if (typeof data.occupancyRate === "number") {
    const rate = Math.round(data.occupancyRate * 100);
    const level = rate > 85 ? "⚠️ High" : rate > 60 ? "Moderate" : "Low";
    parts.push(`📊 **Occupancy Rate**: ${rate}% (${level})`);
  }
  if (typeof data.icuAvailable === "number") {
    parts.push(`🏥 **ICU Available**: ${data.icuAvailable}`);
  }
  if (typeof data.staffOnDuty === "number") {
    parts.push(`👨‍⚕️ **Staff on Duty**: ${data.staffOnDuty}`);
  }

  return parts.join("\n");
}

function formatWaitTime(
  results: BackendResult[],
  entities: AssistantEntities,
  reasoning: MedicalReasoning
): string {
  const primary = results.find((r) => r.key === "wait-time" && r.ok);
  const data = primary ? unwrapData(primary.data) : null;

  if (!data) {
    return "I couldn't estimate the wait time right now. Please try again shortly.";
  }

  const parts: string[] = [];
  const dept = entities.department ?? reasoning.inferredDepartment ?? "the requested department";

  parts.push(`Here is the wait-time analysis for **${dept}**:`);
  parts.push("");

  const waitDays = data.waitingDays ?? data.waitTimeDays ?? data.avgWaitTime ?? data.days ?? data.waitTime;
  if (typeof waitDays === "number") {
    parts.push(`⏱️ **Estimated Wait**: ${waitDays} days`);
  }

  const level = data.delayLevel ?? data.waitingLabel ?? data.level;
  if (typeof level === "string") {
    const emoji = level === "high" ? "🔴" : level === "medium" ? "🟡" : "🟢";
    parts.push(`${emoji} **Congestion Level**: ${level}`);
  }

  const msg = pickString(data.message as unknown);
  if (msg && !parts.some((p) => p.includes(msg))) {
    parts.push("");
    parts.push(msg);
  }

  return parts.join("\n");
}

function formatDisease(
  results: BackendResult[],
  entities: AssistantEntities,
  reasoning: MedicalReasoning
): string {
  const primary = results.find((r) => r.key === "disease" && r.ok);
  const data = primary ? unwrapData(primary.data) : null;

  const parts: string[] = [];

  if (entities.symptoms && entities.symptoms.length > 0) {
    parts.push(`Based on your symptoms (${entities.symptoms.join(", ")}), here is my analysis:`);
  } else {
    parts.push("Here is the symptom analysis:");
  }
  parts.push("");

  if (data) {
    const msg = pickString(data.message as unknown);
    if (msg) parts.push(msg);

    const disease = pickString(data.disease as unknown, data.prediction as unknown);
    if (disease) {
      parts.push(`🔍 **Most Likely Condition**: ${disease}`);
    }

    const probability = data.probability ?? data.confidence;
    if (typeof probability === "number") {
      parts.push(`📊 **Confidence**: ${(probability * 100).toFixed(0)}%`);
    }
  } else {
    parts.push("I couldn't complete the analysis at this time. Please try again.");
  }

  // Supplementary bed info for high-severity cases
  const bedResult = results.find((r) => r.key === "disease-beds" && r.ok);
  if (bedResult && reasoning.urgency >= 3) {
    const bedData = unwrapData(bedResult.data);
    if (bedData && typeof bedData.freeBeds === "number") {
      parts.push("");
      parts.push(`🛏️ Bed availability: **${bedData.freeBeds}** beds available in ${bedData.department ?? reasoning.inferredDepartment ?? "relevant department"}.`);
    }
  }

  parts.push("");
  parts.push("⚕️ *This is an AI-assisted preliminary analysis. Please consult a healthcare professional for diagnosis.*");

  return parts.join("\n");
}

function formatRecommendations(results: BackendResult[]): string {
  const primary = results.find((r) => r.key === "recommendations" && r.ok);
  const data = primary ? unwrapData(primary.data) : null;

  if (!data) {
    return "I couldn't fetch recommendations right now. Try asking about surgery cost, bed availability, or wait times.";
  }

  const parts: string[] = [];
  parts.push("Here are tailored recommendations based on current hospital data:");
  parts.push("");

  const msg = pickString(data.message as unknown);
  if (msg) parts.push(msg);

  const bestTime = pickString(data.bestTime as unknown);
  const worstTime = pickString(data.worstTime as unknown);

  if (bestTime) parts.push(`✅ **Best time to visit**: ${bestTime}`);
  if (worstTime) parts.push(`❌ **Avoid visiting at**: ${worstTime}`);

  return parts.join("\n");
}

function formatUnknown(results: BackendResult[]): string {
  // Try to use recommendations fallback
  const rec = results.find((r) => r.ok);
  if (rec) {
    return formatRecommendations(results);
  }

  return (
    "I'm not sure I fully understood that. I can help you with:\n\n" +
    "• **Surgery planning** — cost, recovery, and admission details\n" +
    "• **Price estimates** — procedure and treatment costs\n" +
    "• **Bed availability** — department-wise availability\n" +
    "• **Wait times** — expected queues and delays\n" +
    "• **Symptom analysis** — preliminary disease assessment\n\n" +
    "Try asking a specific question!"
  );
}

// ── Main formatter ──

/**
 * Formats the backend results into a conversational response.
 */
export function formatResponse(
  intent: AssistantIntent,
  results: BackendResult[],
  entities: AssistantEntities,
  reasoning: MedicalReasoning,
  plan: ActionPlan
): FormattedResponse {
  const prefix = TONE_PREFIX[plan.tone];
  let message: string;

  // Check if all critical actions failed
  const criticalResults = results.filter((r) => r.priority === "primary");
  const allCriticalFailed = criticalResults.length > 0 && criticalResults.every((r) => !r.ok);

  if (allCriticalFailed) {
    const firstError = criticalResults[0];
    message = formatErrorMessage(intent, firstError?.status ?? 500);
  } else {
    switch (intent) {
      case "emergency":
        message = formatEmergency(results, entities, reasoning);
        break;
      case "surgery-plan":
        message = formatSurgeryPlan(results, entities);
        break;
      case "price":
        message = formatPrice(results, entities);
        break;
      case "bed":
        message = formatBed(results, entities, reasoning);
        break;
      case "wait-time":
        message = formatWaitTime(results, entities, reasoning);
        break;
      case "disease":
        message = formatDisease(results, entities, reasoning);
        break;
      case "recommendations":
        message = formatRecommendations(results);
        break;
      default:
        message = formatUnknown(results);
    }
  }

  return {
    message: prefix + message,
    sections: [],
    suggestions: plan.followUps,
  };
}

function formatErrorMessage(intent: AssistantIntent, status: number): string {
  if (status >= 500) return "Our prediction service is temporarily unavailable. Please try again in a moment.";
  if (status === 400) return "I need a bit more information to answer that. Could you add more details?";
  if (status === 401 || status === 403) return "Your session may have expired. Please sign in again and retry.";
  return intent === "unknown"
    ? "I couldn't understand that request clearly. Could you rephrase your question?"
    : "I wasn't able to process this request right now. Please try again.";
}

/**
 * Formats a clarification response when the planner decides to ask first.
 */
export function formatClarification(
  intent: AssistantIntent,
  plan: ActionPlan
): FormattedResponse {
  return {
    message: plan.clarificationMessage ?? "Could you provide a few more details?",
    sections: [],
    suggestions: plan.followUps,
  };
}
