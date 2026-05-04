import { NextRequest, NextResponse } from "next/server";

/**
 * Thin proxy to the backend assistant orchestrator.
 *
 * All intelligence (intent classification, entity normalization, routing, validation)
 * is handled server-side. This route only forwards the message and returns the response.
 */

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

interface AssistantApiResponse {
  intent: string;
  message: string;
  data: unknown;
  confidence: number;
  suggestions: string[];
}

const FALLBACK_RESPONSE: AssistantApiResponse = {
  intent: "unknown",
  message: "Unable to reach the assistant backend. Please try again.",
  data: null,
  confidence: 0,
  suggestions: ["Ask about surgery cost", "Ask about a disease", "Check bed availability"],
};

export async function POST(request: NextRequest) {
  let body: { message?: string };

  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json<AssistantApiResponse>(
      {
        intent: "unknown",
        message: "Please send a valid JSON body with a 'message' field.",
        data: null,
        confidence: 0,
        suggestions: ["Ask about surgery cost", "Ask about wait time", "Ask about bed availability"],
      },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json<AssistantApiResponse>(
      {
        intent: "unknown",
        message: "Please type a question about surgery planning, disease info, pricing, or bed availability.",
        data: null,
        confidence: 0,
        suggestions: ["Ask about surgery cost", "Ask about a disease", "Check bed availability"],
      },
      { status: 400 }
    );
  }

  // Forward authorization header from the client to the backend
  const authorization = request.headers.get("authorization") ?? undefined;

  try {
    const response = await fetch(`${backendUrl}/api/assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify({ message }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: AssistantApiResponse;
      try {
        errorData = JSON.parse(errorText) as AssistantApiResponse;
      } catch {
        errorData = { ...FALLBACK_RESPONSE, message: `Backend error: ${response.status}` };
      }
      return NextResponse.json<AssistantApiResponse>(errorData, { status: response.status });
    }

    const data = (await response.json()) as AssistantApiResponse;
    return NextResponse.json<AssistantApiResponse>(data);
  } catch (error) {
    console.error("[Assistant Proxy] Backend unreachable:", error instanceof Error ? error.message : error);
    return NextResponse.json<AssistantApiResponse>(FALLBACK_RESPONSE, { status: 502 });
  }
}
