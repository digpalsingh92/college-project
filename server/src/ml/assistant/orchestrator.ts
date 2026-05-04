/**
 * Orchestrator — Main Query Handler
 *
 * Flow: classify intent → normalize entities → route to engine → validate → respond.
 */

import { classifyIntent, type AssistantIntent } from "./intent-classifier.js";
import { normalizeEntities, type ExtractedEntities } from "./entity-normalizer.js";
import { runSurgeryEngine } from "./surgery-engine.js";
import { runDiseaseEngine } from "./disease-engine.js";
import { runBookingEngine } from "./booking-engine.js";
import { validateResponse, type StructuredResponse } from "./response-validator.js";
import { getContext, updateContext, clearContext } from "./context-store.js";
import { estimatePrice } from "../price-inference.js";
import { estimateBedAvailability } from "../bed-inference.js";
import { getRecommendations } from "../recommendations.js";

// ── Suggestion helpers ──

const SUGGESTIONS: Record<AssistantIntent, string[]> = {
  surgery_plan: [
    "What is the cost of this surgery?",
    "How long is the recovery period?",
    "Are beds available for this department?",
  ],
  disease_info: [
    "What precautions should I take?",
    "Do I need surgery for this?",
    "What is the wait time for a consultation?",
  ],
  price_estimate: [
    "Plan my surgery",
    "Check bed availability",
    "How long is the wait time?",
  ],
  bed_availability: [
    "What is the cost for admission?",
    "How long is the wait time?",
    "Plan a surgery",
  ],
  wait_time: [
    "Plan a surgery",
    "Check bed availability",
    "What is the cost?",
  ],
  appointment_booking: [
    "Check available doctors",
    "What is the consultation fee?",
    "Check bed availability",
  ],
  clarification: [],
  unknown: [
    "Ask about surgery cost",
    "Ask about a disease",
    "Check bed availability",
    "Book an appointment",
  ],
};

// ── Main handler ──

export async function handleUserQuery(
  query: string,
  userId: string = "anonymous"
): Promise<StructuredResponse> {
  const trimmed = query.trim();

  // Handle clear context command
  if (/^(clear|reset)\s*(context|memory|chat)$/i.test(trimmed)) {
    clearContext(userId);
    return {
      intent: "unknown",
      message: "Conversation memory cleared. You can start a fresh request now.",
      data: null,
      confidence: 1,
      suggestions: SUGGESTIONS.unknown,
    };
  }

  // 1. Get conversation context
  const context = getContext(userId);

  // 2. Classify intent
  const intentResult = classifyIntent(trimmed, context.lastIntent);

  // 3. Handle clarification from intent classifier
  if (intentResult.intent === "clarification" && intentResult.alternatives) {
    const options = intentResult.alternatives.map((a) => a.label);
    updateContext(userId, { userMessage: trimmed });

    return {
      intent: "clarification",
      message: `I'm not sure what you're looking for. Are you asking about: ${options.join(" or ")}?`,
      data: { alternatives: intentResult.alternatives },
      confidence: intentResult.confidence,
      suggestions: options,
    };
  }

  // 4. Normalize entities
  const normResult = normalizeEntities(trimmed, intentResult.intent, context.entities);

  // 5. Handle clarification from entity normalizer (e.g., "knee stone removal")
  if (normResult.needsClarification) {
    updateContext(userId, { lastIntent: intentResult.intent, userMessage: trimmed });

    return {
      intent: "clarification",
      message: normResult.clarificationMessage ?? "Could you please clarify what you mean?",
      data: { options: normResult.clarificationOptions },
      confidence: intentResult.confidence,
      suggestions: normResult.clarificationOptions ?? [],
    };
  }

  // 6. Route to correct engine
  let response: StructuredResponse;

  try {
    response = await routeToEngine(intentResult.intent, trimmed, normResult.entities, intentResult.confidence);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error(`[Orchestrator] Engine error for intent=${intentResult.intent}:`, errorMessage);

    response = {
      intent: intentResult.intent,
      message: `I encountered an issue processing your request: ${errorMessage}. Please try again.`,
      data: null,
      confidence: 0,
      suggestions: SUGGESTIONS[intentResult.intent] ?? SUGGESTIONS.unknown,
    };
  }

  // 7. Validate response
  response = validateResponse(response);

  // 8. Update context
  updateContext(userId, {
    lastIntent: intentResult.intent,
    entities: normResult.entities,
    userMessage: trimmed,
    assistantMessage: response.message,
  });

  return response;
}

// ── Engine routing ──

async function routeToEngine(
  intent: AssistantIntent,
  query: string,
  entities: ExtractedEntities,
  confidence: number
): Promise<StructuredResponse> {
  switch (intent) {
    case "surgery_plan":
      return handleSurgeryPlan(entities, confidence);
    case "disease_info":
      return handleDiseaseInfo(entities, confidence);
    case "price_estimate":
      return handlePriceEstimate(entities, confidence);
    case "bed_availability":
      return handleBedAvailability(entities, confidence);
    case "wait_time":
      return handleWaitTime(confidence);
    case "appointment_booking":
      return handleBooking(query, entities, confidence);
    default:
      return handleUnknown();
  }
}

async function handleSurgeryPlan(entities: ExtractedEntities, confidence: number): Promise<StructuredResponse> {
  const surgeryType = entities.surgeryType ?? entities.procedure ?? "general surgery";
  const age = entities.age ?? 30;
  const conditions = entities.symptoms ?? [];

  const result = await runSurgeryEngine({ surgeryType, patientAge: age, conditions });

  return {
    intent: "surgery_plan",
    message: `Here is your surgery plan for ${result.surgeryType}.`,
    data: result as unknown as Record<string, unknown>,
    confidence: Math.max(confidence, result.confidence),
    suggestions: SUGGESTIONS.surgery_plan,
  };
}

async function handleDiseaseInfo(entities: ExtractedEntities, confidence: number): Promise<StructuredResponse> {
  const result = await runDiseaseEngine(entities);

  const msg = result.mode === "name_lookup"
    ? `Here is information about ${result.disease}.`
    : result.disease !== "Unknown"
      ? `Based on the symptoms provided, the most likely condition is ${result.disease}.`
      : "I need more information to identify the condition. Please describe your symptoms.";

  return {
    intent: "disease_info",
    message: msg,
    data: result as unknown as Record<string, unknown>,
    confidence: Math.max(confidence, result.confidence),
    suggestions: SUGGESTIONS.disease_info,
  };
}

async function handlePriceEstimate(entities: ExtractedEntities, confidence: number): Promise<StructuredResponse> {
  const procedure = entities.procedure ?? entities.surgeryType ?? "general consultation";
  const result = await estimatePrice({ procedure });

  return {
    intent: "price_estimate",
    message: `Here is the estimated price for ${result.procedure}.`,
    data: result as unknown as Record<string, unknown>,
    confidence,
    suggestions: SUGGESTIONS.price_estimate,
  };
}

async function handleBedAvailability(entities: ExtractedEntities, confidence: number): Promise<StructuredResponse> {
  const result = await estimateBedAvailability({ department: entities.department });

  return {
    intent: "bed_availability",
    message: `Here is the bed availability for ${result.department}.`,
    data: result as unknown as Record<string, unknown>,
    confidence,
    suggestions: SUGGESTIONS.bed_availability,
  };
}

async function handleWaitTime(confidence: number): Promise<StructuredResponse> {
  try {
    const result = await getRecommendations();
    return {
      intent: "wait_time",
      message: "Here are the wait-time recommendations.",
      data: result as unknown as Record<string, unknown>,
      confidence,
      suggestions: SUGGESTIONS.wait_time,
    };
  } catch {
    return {
      intent: "wait_time",
      message: "Wait time data is currently unavailable. Please try again later.",
      data: null,
      confidence: 0.3,
      suggestions: SUGGESTIONS.wait_time,
    };
  }
}

function handleBooking(query: string, entities: ExtractedEntities, confidence: number): StructuredResponse {
  const result = runBookingEngine(query, entities.department);

  return {
    intent: "appointment_booking",
    message: result.message,
    data: result as unknown as Record<string, unknown>,
    confidence,
    suggestions: SUGGESTIONS.appointment_booking,
  };
}

function handleUnknown(): StructuredResponse {
  return {
    intent: "unknown",
    message: "I'm not sure I understand. I can help you with surgery planning, disease information, price estimates, bed availability, wait times, or appointment booking.",
    data: null,
    confidence: 0,
    suggestions: SUGGESTIONS.unknown,
  };
}
