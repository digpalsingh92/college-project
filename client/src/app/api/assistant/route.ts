import { NextRequest, NextResponse } from "next/server";
import { routeAssistantRequest } from "@/services/assistant/router.service";
import { clearContext } from "@/services/assistant/context.service";

type AssistantResponse = {
  intent: string;
  message: string;
  data: unknown;
  suggestions: string[];
};

export async function POST(request: NextRequest) {
  let body: { message?: string };

  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json<AssistantResponse>(
      {
        intent: "unknown",
        message: "Send a question about surgery planning, price, wait time, bed availability, or symptoms.",
        data: null,
        suggestions: ["Ask about surgery cost", "Ask about wait time", "Ask about bed availability"],
      },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json<AssistantResponse>(
      {
        intent: "unknown",
        message: "Send a question about surgery planning, price, wait time, bed availability, or symptoms.",
        data: null,
        suggestions: ["Ask about surgery cost", "Ask about wait time", "Ask about bed availability"],
      },
      { status: 400 }
    );
  }

  const authorization = request.headers.get("authorization") ?? undefined;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userId = request.headers.get("x-user-id") ?? authorization ?? forwardedFor ?? "anonymous";

  if (/^(clear|reset)\s*(context|memory)$/i.test(message)) {
    clearContext(userId);
    return NextResponse.json<AssistantResponse>({
      intent: "recommendations",
      message: "Conversation memory cleared. You can start a fresh request now.",
      data: null,
      suggestions: ["Ask for surgery planning", "Ask for a price estimate", "Ask for wait-time guidance"],
    });
  }

  const result = await routeAssistantRequest({
    userId,
    message,
    authorization,
  });

  return NextResponse.json<AssistantResponse>(result.body, { status: result.status });
}
