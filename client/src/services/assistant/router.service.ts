/**
 * Assistant Router — Decision Engine Orchestrator
 *
 * Coordinates the full AI pipeline:
 *   1. Intent Detection        → What does the user want?
 *   2. Entity Extraction       → What facts did they provide?
 *   3. Medical Reasoning       → How urgent? Should we escalate? What's missing?
 *   4. Response Planning       → Which backends to call, in what order?
 *   5. Backend Orchestration   → Execute the plan, handle failures
 *   6. Conversational Formatting → Turn raw data into a human response
 */

import { extractEntities, computeEntityConfidence } from "@/services/assistant/entity.service";
import { getContext, updateContext } from "@/services/assistant/context.service";
import { detectIntent } from "@/services/assistant/intent.service";
import { performMedicalReasoning } from "@/services/assistant/reasoning.service";
import { buildActionPlan } from "@/services/assistant/planner.service";
import { formatResponse, formatClarification } from "@/services/assistant/formatter.service";
import type {
  AssistantIntent,
  AssistantResponse,
  BackendAction,
  BackendResult,
  ParsedAssistantRequest,
} from "@/services/assistant/types";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type AssistantRouteResult = {
  status: number;
  body: AssistantResponse;
};

// ── Backend call execution ──

async function executeBackendCall(action: BackendAction, authorization?: string): Promise<BackendResult> {
  const url = `${backendUrl}${action.endpoint}`;
  const init: RequestInit = {
    method: action.method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
  };

  if (action.method === "POST") {
    init.body = JSON.stringify(action.body);
  }

  let lastResult: BackendResult | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, init);
      const raw = await response.text();

      let data: unknown = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { message: raw };
        }
      }

      const result: BackendResult = {
        key: action.key,
        label: action.label,
        ok: response.ok,
        status: response.status,
        data,
        priority: action.priority,
      };

      if (result.ok) return result;
      lastResult = result;
    } catch {
      lastResult = {
        key: action.key,
        label: action.label,
        ok: false,
        status: 502,
        data: null,
        priority: action.priority,
      };
    }
  }

  return lastResult ?? {
    key: action.key,
    label: action.label,
    ok: false,
    status: 502,
    data: null,
    priority: action.priority,
  };
}

/**
 * Execute all actions in the plan.
 * Primary actions run sequentially (order matters).
 * Supplementary actions run in parallel for speed.
 */
async function executeActionPlan(actions: BackendAction[], authorization?: string): Promise<BackendResult[]> {
  const primaryActions = actions.filter((a) => a.priority === "primary");
  const supplementaryActions = actions.filter((a) => a.priority === "supplementary");

  // Execute primary actions sequentially
  const results: BackendResult[] = [];
  for (const action of primaryActions) {
    const result = await executeBackendCall(action, authorization);
    results.push(result);

    // If a critical action fails, don't bother with supplementary
    if (!result.ok && action.critical) {
      break;
    }
  }

  // Execute supplementary actions in parallel (best-effort)
  if (supplementaryActions.length > 0) {
    const supplementaryResults = await Promise.allSettled(
      supplementaryActions.map((a) => executeBackendCall(a, authorization))
    );

    for (const settled of supplementaryResults) {
      if (settled.status === "fulfilled") {
        results.push(settled.value);
      }
    }
  }

  return results;
}

// ── Recommendations fallback (multiple endpoint attempts) ──

async function callRecommendationsFallback(authorization?: string): Promise<BackendResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authorization ? { Authorization: authorization } : {}),
  };

  const fallbackPaths = [
    { path: "/api/predict/recommendations", method: "POST", body: "{}" },
    { path: "/api/predictions/recommendations", method: "POST", body: "{}" },
    { path: "/api/predictions/recommendations", method: "GET", body: undefined },
  ];

  for (const fb of fallbackPaths) {
    try {
      const response = await fetch(`${backendUrl}${fb.path}`, {
        method: fb.method,
        cache: "no-store",
        headers,
        body: fb.body,
      });

      const raw = await response.text();
      let data: unknown = null;
      if (raw) {
        try { data = JSON.parse(raw); } catch { data = { message: raw }; }
      }

      if (response.ok) {
        return { key: "recommendations", label: "Recommendations", ok: true, status: response.status, data, priority: "primary" };
      }
    } catch {
      // try next
    }
  }

  return { key: "recommendations", label: "Recommendations", ok: false, status: 502, data: null, priority: "primary" };
}

// ── Main pipeline orchestrator ──

export async function routeAssistantRequest(input: ParsedAssistantRequest): Promise<AssistantRouteResult> {
  // ── Stage 1: Intent Detection ──
  const context = getContext(input.userId);
  const intentResult = detectIntent(input.message, context.lastIntent);

  // ── Stage 2: Entity Extraction ──
  const entities = extractEntities(input.message, context);

  // ── Stage 3: Medical Reasoning ──
  const reasoning = performMedicalReasoning(
    input.message,
    intentResult,
    entities,
    context
  );

  const effectiveIntent = reasoning.escalatedIntent ?? intentResult.primaryIntent;

  // ── Stage 4: Response Planning ──
  const plan = buildActionPlan(
    input.message,
    intentResult,
    entities,
    reasoning,
    context
  );

  // If the planner says we should ask for clarification first, do that
  if (plan.askFirst) {
    // Still update context so follow-ups work
    updateContext(input.userId, { lastIntent: effectiveIntent, entities });

    const formatted = formatClarification(effectiveIntent, plan);
    return {
      status: 200,
      body: {
        intent: effectiveIntent,
        message: formatted.message,
        data: null,
        suggestions: formatted.suggestions,
      },
    };
  }

  // ── Stage 5: Backend Orchestration ──
  try {
    let results: BackendResult[];

    if (plan.actions.length > 0) {
      results = await executeActionPlan(plan.actions, input.authorization);
    } else {
      // Fallback: no actions planned → recommendations
      const fallback = await callRecommendationsFallback(input.authorization);
      results = [fallback];
    }

    // Special handling for recommendations intent (needs fallback logic)
    if (effectiveIntent === "recommendations" || effectiveIntent === "unknown") {
      const primaryOk = results.some((r) => r.priority === "primary" && r.ok);
      if (!primaryOk) {
        const fallback = await callRecommendationsFallback(input.authorization);
        results = [fallback, ...results.filter((r) => r.priority === "supplementary")];
      }
    }

    // ── Stage 6: Conversational Formatting ──
    const formatted = formatResponse(
      effectiveIntent,
      results,
      entities,
      reasoning,
      plan
    );

    // Persist context after successful processing
    updateContext(input.userId, { lastIntent: effectiveIntent, entities });

    // Assemble the primary result data for structured UI cards (prefer RAG grounded data if available)
    const ragResult = results.find((r) => r.key === "rag-context" && r.ok);
    const ragData = ragResult ? (ragResult.data as any) : null;

    const primaryResult = results.find((r) => r.priority === "primary" && r.ok);
    const responseData = (ragData && ragData.data && Object.keys(ragData.data).length > 0)
      ? ragData.data
      : (primaryResult ? unwrapResponseData(primaryResult.data) : null);

    return {
      status: 200,
      body: {
        intent: effectiveIntent,
        message: formatted.message,
        data: responseData,
        suggestions: formatted.suggestions,
      },
    };
  } catch {
    return {
      status: 502,
      body: {
        intent: effectiveIntent,
        message: "Unable to reach the assistant backend right now. Please try again in a moment.",
        data: null,
        suggestions: ["Try again", "Ask a different question"],
      },
    };
  }
}

function unwrapResponseData(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;
  return obj.data ?? raw;
}
