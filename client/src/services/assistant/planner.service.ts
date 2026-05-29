/**
 * Response Planner Layer
 *
 * Sits between medical reasoning and backend orchestration.
 * Responsibilities:
 *   1. Decides which backend endpoints to call and in what order
 *   2. Plans multi-intent responses (e.g. surgery + price + bed in one answer)
 *   3. Determines response tone based on urgency
 *   4. Generates contextual follow-up suggestions
 */

import { buildDiseasePayload } from "@/services/assistant/entity.service";
import type {
  ActionPlan,
  AssistantEntities,
  AssistantIntent,
  BackendAction,
  DetectedIntent,
  MedicalReasoning,
  ResponseTone,
  AssistantContext,
} from "@/services/assistant/types";

// ── Tone mapping from urgency ──

function toneFromUrgency(urgency: number): ResponseTone {
  if (urgency >= 5) return "urgent";
  if (urgency >= 3) return "empathetic";
  if (urgency >= 2) return "informative";
  return "friendly";
}

// ── Follow-up suggestion generators ──

function generateFollowUps(
  intent: AssistantIntent,
  entities: AssistantEntities,
  reasoning: MedicalReasoning,
  secondaryIntents: AssistantIntent[]
): string[] {
  const suggestions: string[] = [];

  if (reasoning.urgency >= 4) {
    suggestions.push("Find nearby emergency hospitals.");
    suggestions.push("Check ICU bed availability.");
    return suggestions;
  }

  // Primary intent follow-ups
  switch (intent) {
    case "surgery-plan":
      if (entities.surgeryType) {
        suggestions.push(`What is the cost for ${entities.surgeryType}?`);
        suggestions.push("Check bed availability for admission.");
        suggestions.push(`What is the recovery time for ${entities.surgeryType}?`);
      } else {
        suggestions.push("Which surgery are you asking about?");
      }
      break;

    case "price":
      suggestions.push("How long is the typical recovery?");
      suggestions.push("Check bed availability.");
      if (entities.surgeryType) {
        suggestions.push(`Get a surgery plan for ${entities.surgeryType}.`);
      }
      break;

    case "wait-time":
      suggestions.push("Which department should I check?");
      suggestions.push("Check bed availability instead.");
      break;

    case "bed":
      suggestions.push("Check ICU vs general ward.");
      suggestions.push("What is the expected wait time?");
      suggestions.push("Check room pricing options.");
      break;

    case "disease":
      suggestions.push("Share more symptoms for better analysis.");
      suggestions.push("What is the patient's age and gender?");
      suggestions.push("How long have you had these symptoms?");
      break;

    case "recommendations":
      suggestions.push("Ask about bed availability.");
      suggestions.push("Ask for a price estimate.");
      suggestions.push("Ask about wait times.");
      break;

    default:
      suggestions.push("Ask about surgery cost.");
      suggestions.push("Ask about bed availability.");
      suggestions.push("Ask about wait time.");
  }

  // Add cross-intent suggestions if secondary intents were detected
  for (const secondary of secondaryIntents.slice(0, 1)) {
    if (secondary !== intent && secondary !== "unknown") {
      const label = intentLabel(secondary);
      if (!suggestions.some((s) => s.toLowerCase().includes(label.toLowerCase()))) {
        suggestions.push(`Also ask about ${label}.`);
      }
    }
  }

  return suggestions.slice(0, 3);
}

function intentLabel(intent: AssistantIntent): string {
  switch (intent) {
    case "surgery-plan": return "surgery planning";
    case "price": return "pricing";
    case "wait-time": return "wait times";
    case "bed": return "bed availability";
    case "disease": return "symptom analysis";
    case "recommendations": return "recommendations";
    case "emergency": return "emergency services";
    default: return "general guidance";
  }
}

// ── Action builders ──

function buildSurgeryAction(entities: AssistantEntities, context: AssistantContext): BackendAction {
  return {
    key: "surgery-plan",
    endpoint: "/api/predictions/surgery-plan",
    method: "POST",
    body: {
      surgeryType: entities.surgeryType ?? context.entities.surgeryType,
      patientAge: entities.age ?? context.entities.age,
      conditions: entities.symptoms ?? [],
    },
    priority: "primary",
    critical: true,
    label: "Surgery Plan",
  };
}

function buildPriceAction(entities: AssistantEntities, message: string): BackendAction {
  return {
    key: "price",
    endpoint: "/api/predictions/price-estimation",
    method: "POST",
    body: { procedure: entities.surgeryType ?? message },
    priority: "primary",
    critical: true,
    label: "Price Estimate",
  };
}

function buildBedAction(entities: AssistantEntities, inferredDept?: string): BackendAction {
  return {
    key: "bed",
    endpoint: "/api/predictions/bed-availability",
    method: "POST",
    body: {
      department: entities.department ?? inferredDept,
      wardType: entities.wardType,
      city: entities.city,
    },
    priority: "primary",
    critical: true,
    label: "Bed Availability",
  };
}

function buildWaitTimeAction(entities: AssistantEntities, context: AssistantContext, inferredDept?: string): BackendAction {
  return {
    key: "wait-time",
    endpoint: "/api/predictions/wait-time",
    method: "POST",
    body: {
      department: entities.department ?? context.entities.department ?? inferredDept,
      city: entities.city,
      severity: entities.severity,
    },
    priority: "primary",
    critical: true,
    label: "Wait Time",
  };
}

function buildDiseaseAction(entities: AssistantEntities, message: string): BackendAction {
  return {
    key: "disease",
    endpoint: "/api/predictions/disease",
    method: "POST",
    body: buildDiseasePayload(message, entities),
    priority: "primary",
    critical: true,
    label: "Symptom Analysis",
  };
}

function buildEmergencyAction(entities: AssistantEntities): BackendAction {
  return {
    key: "emergency",
    endpoint: "/api/predictions/emergency",
    method: "POST",
    body: {
      symptoms: entities.symptoms ?? [],
      severity: entities.severity,
      city: entities.city,
      department: entities.department,
    },
    priority: "primary",
    critical: true,
    label: "Emergency Assessment",
  };
}

function buildRecommendationsAction(): BackendAction {
  return {
    key: "recommendations",
    endpoint: "/api/predictions/recommendations",
    method: "GET",
    body: {},
    priority: "primary",
    critical: true,
    label: "Recommendations",
  };
}

/**
 * Build an action plan based on the medical reasoning and detected intents.
 */
export function buildActionPlan(
  message: string,
  intentResult: DetectedIntent,
  entities: AssistantEntities,
  reasoning: MedicalReasoning,
  context: AssistantContext
): ActionPlan {
  const planTrace: string[] = [];
  const actions: BackendAction[] = [];

  const effectiveIntent = reasoning.escalatedIntent ?? intentResult.primaryIntent;
  const tone = toneFromUrgency(reasoning.urgency);

  planTrace.push(`Effective intent: ${effectiveIntent} (tone: ${tone})`);

  // ── If clarification is needed, return early with no actions ──
  if (reasoning.needsClarification && reasoning.clarificationPrompt) {
    planTrace.push("Asking for clarification before proceeding");

    return {
      actions: [],
      tone,
      askFirst: true,
      clarificationMessage: reasoning.clarificationPrompt,
      followUps: generateFollowUps(effectiveIntent, entities, reasoning, intentResult.intents),
      planTrace,
    };
  }

  // ── Build primary action based on effective intent ──
  switch (effectiveIntent) {
    case "emergency":
      actions.push(buildEmergencyAction(entities));
      // Also proactively fetch bed availability for emergency
      actions.push({
        ...buildBedAction(entities, reasoning.inferredDepartment),
        priority: "supplementary",
        critical: false,
        key: "emergency-beds",
      });
      planTrace.push("Planned: emergency assessment + supplementary bed check");
      break;

    case "surgery-plan": {
      actions.push(buildSurgeryAction(entities, context));
      // Proactively fetch bed availability for surgery admission
      actions.push({
        ...buildBedAction(entities, reasoning.inferredDepartment),
        priority: "supplementary",
        critical: false,
        key: "surgery-beds",
      });
      planTrace.push("Planned: surgery plan + supplementary bed availability");
      break;
    }

    case "price":
      actions.push(buildPriceAction(entities, message));
      // If we also know the surgery, proactively get the full plan
      if (entities.surgeryType && intentResult.intents.includes("surgery-plan")) {
        actions.push({
          ...buildSurgeryAction(entities, context),
          priority: "supplementary",
          critical: false,
          key: "price-surgery",
        });
        planTrace.push("Also fetching surgery plan as supplementary");
      }
      break;

    case "bed":
      actions.push(buildBedAction(entities, reasoning.inferredDepartment));
      break;

    case "wait-time":
      actions.push(buildWaitTimeAction(entities, context, reasoning.inferredDepartment));
      break;

    case "disease":
      actions.push(buildDiseaseAction(entities, message));
      // If severity is high, also check bed availability
      if (reasoning.urgency >= 3) {
        actions.push({
          ...buildBedAction(entities, reasoning.inferredDepartment),
          priority: "supplementary",
          critical: false,
          key: "disease-beds",
        });
        planTrace.push("High severity disease → also checking beds");
      }
      break;

    case "recommendations":
      actions.push(buildRecommendationsAction());
      break;

    default:
      actions.push(buildRecommendationsAction());
      planTrace.push("Unknown intent → falling back to recommendations");
      }

  // Always include the server-side RAG search as a supplementary action
  actions.push({
    key: "rag-context",
    endpoint: "/api/assistant",
    method: "POST",
    body: { message },
    priority: "supplementary",
    critical: false,
    label: "Hospital Records Search",
  });

  planTrace.push(`Total actions planned: ${actions.length} (${actions.filter((a) => a.priority === "primary").length} primary)`);

  return {
    actions,
    tone,
    askFirst: false,
    followUps: generateFollowUps(effectiveIntent, entities, reasoning, intentResult.intents),
    planTrace,
  };
}
