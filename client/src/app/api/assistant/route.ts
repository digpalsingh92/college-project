import { NextRequest, NextResponse } from "next/server";

type AssistantIntent = "price" | "wait-time" | "bed";

type AssistantResponse = {
  intent: AssistantIntent | "unknown";
  message: string;
  data?: unknown;
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5000";

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function detectIntent(message: string): AssistantIntent | "unknown" {
  const normalized = normalizeText(message);

  if (/\b(price|cost|estimate|estimated|how much)\b/.test(normalized)) return "price";
  if (/\b(bed|beds|availability|available|occupancy|icu|ward)\b/.test(normalized)) return "bed";
  if (/\b(wait|wait time|queue|how long|soon|delay|slot)\b/.test(normalized)) return "wait-time";

  return "unknown";
}

function extractSubject(message: string): string {
  const normalized = normalizeText(message);
  const cleaned = normalized
    .replace(/\b(what is|what's|whats|tell me|show me|give me|can you|could you|please|the)\b/g, " ")
    .replace(/\b(price|cost|estimate|estimated|wait time|wait|bed|beds|availability|available|queue|how long|how much)\b/g, " ")
    .replace(/\b(for|of|about|on|in|regarding)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 0 ? cleaned : normalized;
}

async function proxyJson(path: string, init?: RequestInit) {
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

  return { response, data };
}

export async function POST(request: NextRequest) {
  let body: { message?: string };

  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json<AssistantResponse>(
      { intent: "unknown", message: "Send a question about price, wait time, or bed availability." },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json<AssistantResponse>(
      { intent: "unknown", message: "Send a question about price, wait time, or bed availability." },
      { status: 400 }
    );
  }

  const intent = detectIntent(message);
  const authorization = request.headers.get("authorization") ?? undefined;

  try {
    if (intent === "price") {
      const procedure = extractSubject(message);
      const { response, data } = await proxyJson("/api/predictions/price-estimation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({ procedure }),
      });

      if (!response.ok) {
        const errorMessage = (data as { message?: string } | null)?.message ?? `Request failed with status ${response.status}`;
        return NextResponse.json<AssistantResponse>({ intent, message: errorMessage }, { status: response.status });
      }

      const payload = data as { message?: string; data?: unknown };
      return NextResponse.json<AssistantResponse>({
        intent,
        message: payload.message ?? "Here is the estimated price.",
        data: payload.data ?? null,
      });
    }

    if (intent === "bed") {
      const department = extractSubject(message);
      const { response, data } = await proxyJson("/api/predictions/bed-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({ department }),
      });

      if (!response.ok) {
        const errorMessage = (data as { message?: string } | null)?.message ?? `Request failed with status ${response.status}`;
        return NextResponse.json<AssistantResponse>({ intent, message: errorMessage }, { status: response.status });
      }

      const payload = data as { message?: string; data?: unknown };
      return NextResponse.json<AssistantResponse>({
        intent,
        message: payload.message ?? "Here is the bed availability.",
        data: payload.data ?? null,
      });
    }

    if (intent === "wait-time") {
      const subject = extractSubject(message);
      const useSurgeryPlan = /\b(knee|cataract|appendectomy|hip|hernia|cardiac|bypass|angioplasty|surgery)\b/.test(normalizeText(message));

      if (useSurgeryPlan) {
        const { response, data } = await proxyJson("/api/predictions/surgery-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authorization ? { Authorization: authorization } : {}),
          },
          body: JSON.stringify({ surgeryType: subject, patientAge: 40, conditions: [] }),
        });

        if (!response.ok) {
          const errorMessage = (data as { message?: string } | null)?.message ?? `Request failed with status ${response.status}`;
          return NextResponse.json<AssistantResponse>({ intent, message: errorMessage }, { status: response.status });
        }

        const payload = data as { message?: string; data?: unknown };
        return NextResponse.json<AssistantResponse>({
          intent,
          message: payload.message ?? "Here is the surgery wait-time estimate.",
          data: payload.data ?? null,
        });
      }

      const { response, data } = await proxyJson("/api/predictions/recommendations", {
        method: "GET",
        headers: {
          ...(authorization ? { Authorization: authorization } : {}),
        },
      });

      if (!response.ok) {
        const errorMessage = (data as { message?: string } | null)?.message ?? `Request failed with status ${response.status}`;
        return NextResponse.json<AssistantResponse>({ intent, message: errorMessage }, { status: response.status });
      }

      const payload = data as { message?: string; data?: unknown };
      return NextResponse.json<AssistantResponse>({
        intent,
        message: payload.message ?? "Here are the best wait-time recommendations.",
        data: payload.data ?? null,
      });
    }

    return NextResponse.json<AssistantResponse>(
      {
        intent: "unknown",
        message: "Ask about price, wait time, or bed availability. For example: 'price for cataract surgery' or 'bed availability in cardiology'.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<AssistantResponse>(
      { intent, message: "Unable to reach the assistant backend right now." },
      { status: 502 }
    );
  }
}