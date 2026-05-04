import { buildDiseasePayload, extractEntities, extractSubject } from "@/services/assistant/entity.service";
import { getContext, updateContext } from "@/services/assistant/context.service";
import { detectIntent } from "@/services/assistant/intent.service";
import type { AssistantIntent, AssistantResponse, ParsedAssistantRequest } from "@/services/assistant/types";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type BackendCallResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

type AssistantRouteResult = {
  status: number;
  body: AssistantResponse;
};

function createSuggestions(intent: AssistantIntent): string[] {
  const defaults: Record<AssistantIntent, string[]> = {
    "surgery-plan": [
      "Ask about expected recovery timeline.",
      "Ask for cost range for this surgery.",
      "Ask about bed availability for admission.",
    ],
    price: ["Ask for surgery recovery planning.", "Ask about current bed availability.", "Ask for wait-time guidance."],
    "wait-time": ["Ask for surgery planning details.", "Ask for cost estimate.", "Ask for best time to visit."],
    bed: ["Ask about wait-time guidance.", "Ask for surgery planning.", "Ask for procedure cost estimate."],
    disease: ["Share more symptoms for better triage.", "Ask for wait-time recommendation.", "Ask for surgery planning if needed."],
    recommendations: ["Ask for surgery planning.", "Ask for bed availability.", "Ask for price estimate."],
    unknown: ["Ask about surgery cost.", "Ask about wait time.", "Ask about bed availability."],
  };

  return defaults[intent];
}

function buildResponse(intent: AssistantIntent, message: string, data: unknown): AssistantResponse {
  return {
    intent,
    message,
    data,
    suggestions: createSuggestions(intent),
  };
}

function toUserFriendlyError(intent: AssistantIntent, status: number, fallback = "Unable to process this request right now."): string {
  if (status >= 500) return "Our prediction service is temporarily unavailable. Please try again in a moment.";
  if (status === 400) return "I need a bit more information to answer that. Please add more details and try again.";
  if (status === 401 || status === 403) return "Your session may have expired. Please sign in again and retry.";
  return intent === "unknown" ? "I could not understand that request clearly. Please rephrase your question." : fallback;
}

async function callBackend(path: string, init?: RequestInit): Promise<BackendCallResult> {
  let lastResult: BackendCallResult | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${backendUrl}${path}`, {
        cache: "no-store",
        ...init,
      });

      const raw = await response.text();
      let data: unknown = null;
      if (raw) {
        try {
          data = JSON.parse(raw) as unknown;
        } catch {
          data = { message: raw };
        }
      }

      const result: BackendCallResult = {
        ok: response.ok,
        status: response.status,
        data,
      };

      if (result.ok) return result;
      lastResult = result;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResult) return lastResult;

  throw new Error(lastError instanceof Error ? lastError.message : "Prediction service request failed");
}

async function callRecommendationsFallback(authorization?: string): Promise<BackendCallResult> {
  const headers = {
    ...(authorization ? { Authorization: authorization } : {}),
  };

  const fallbackRequests: Array<{ path: string; init: RequestInit }> = [
    { path: "/api/predict/recommendations", init: { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: "{}" } },
    { path: "/api/predictions/recommendations", init: { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: "{}" } },
    { path: "/api/predictions/recommendations", init: { method: "GET", headers } },
  ];

  let latestResult: BackendCallResult = {
    ok: false,
    status: 502,
    data: { message: "Recommendations endpoint unavailable" },
  };

  for (const request of fallbackRequests) {
    const result = await callBackend(request.path, request.init);
    if (result.ok) return result;
    latestResult = result;
  }

  return latestResult;
}

function payloadMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const maybeMessage = (data as { message?: unknown }).message;
  return typeof maybeMessage === "string" ? maybeMessage : undefined;
}

export async function routeAssistantRequest(input: ParsedAssistantRequest): Promise<AssistantRouteResult> {
  const context = getContext(input.userId);
  const intentResult = detectIntent(input.message, context.lastIntent);
  const entities = extractEntities(input.message, context);

  updateContext(input.userId, {
    lastIntent: intentResult.primaryIntent,
    entities,
  });

  const headers = {
    "Content-Type": "application/json",
  };

  const surgeryAge = entities.age ?? context.entities.age ?? 30;
  const surgeryType = entities.surgeryType ?? extractSubject(input.message) ?? "general surgery";

  try {
    if (intentResult.surgeryFirst || intentResult.primaryIntent === "surgery-plan") {
      const result = await callBackend("/api/predictions/surgery-plan", {
        method: "POST",
        headers,
        body: JSON.stringify({ surgeryType, patientAge: surgeryAge, conditions: entities.symptoms ?? [] }),
      });

      if (!result.ok) {
        return {
          status: result.status,
          body: buildResponse("surgery-plan", toUserFriendlyError("surgery-plan", result.status), null),
        };
      }

      return {
        status: 200,
        body: buildResponse(
          "surgery-plan",
          payloadMessage(result.data) ?? "Here is your personalized surgery planning summary.",
          (result.data as { data?: unknown } | null)?.data ?? result.data
        ),
      };
    }

    if (intentResult.primaryIntent === "disease") {
      const result = await callBackend("/api/predictions/disease", {
        method: "POST",
        headers,
        body: JSON.stringify(buildDiseasePayload(input.message, entities)),
      });

      if (!result.ok) {
        return {
          status: result.status,
          body: buildResponse("disease", toUserFriendlyError("disease", result.status), null),
        };
      }

      return {
        status: 200,
        body: buildResponse(
          "disease",
          payloadMessage(result.data) ?? "Here is the most likely disease based on the symptoms provided.",
          (result.data as { data?: unknown } | null)?.data ?? result.data
        ),
      };
    }

    if (intentResult.primaryIntent === "price") {
      const result = await callBackend("/api/predictions/price-estimation", {
        method: "POST",
        headers,
        body: JSON.stringify({ procedure: surgeryType || extractSubject(input.message) }),
      });

      if (!result.ok) {
        return {
          status: result.status,
          body: buildResponse("price", toUserFriendlyError("price", result.status), null),
        };
      }

      return {
        status: 200,
        body: buildResponse(
          "price",
          payloadMessage(result.data) ?? "Here is the estimated price.",
          (result.data as { data?: unknown } | null)?.data ?? result.data
        ),
      };
    }

    if (intentResult.primaryIntent === "bed") {
      const result = await callBackend("/api/predictions/bed-availability", {
        method: "POST",
        headers,
        body: JSON.stringify({ department: extractSubject(input.message) }),
      });

      if (!result.ok) {
        return {
          status: result.status,
          body: buildResponse("bed", toUserFriendlyError("bed", result.status), null),
        };
      }

      return {
        status: 200,
        body: buildResponse(
          "bed",
          payloadMessage(result.data) ?? "Here is the bed availability status.",
          (result.data as { data?: unknown } | null)?.data ?? result.data
        ),
      };
    }

    if (intentResult.primaryIntent === "wait-time" || intentResult.primaryIntent === "recommendations") {
      const result = await callRecommendationsFallback();
      if (!result.ok) {
        return {
          status: result.status,
          body: buildResponse("recommendations", toUserFriendlyError("recommendations", result.status), null),
        };
      }

      return {
        status: 200,
        body: buildResponse(
          "recommendations",
          payloadMessage(result.data) ?? "Here are the latest wait-time recommendations.",
          (result.data as { data?: unknown } | null)?.data ?? result.data
        ),
      };
    }

    const fallback = await callRecommendationsFallback();
    if (!fallback.ok) {
      return {
        status: fallback.status,
        body: buildResponse("unknown", toUserFriendlyError("unknown", fallback.status), null),
      };
    }

    return {
      status: 200,
      body: buildResponse(
        "unknown",
        "Here are general suggestions based on hospital trends",
        (fallback.data as { data?: unknown } | null)?.data ?? fallback.data
      ),
    };
  } catch {
    return {
      status: 502,
      body: buildResponse("unknown", "Unable to reach the assistant backend right now.", null),
    };
  }
}
