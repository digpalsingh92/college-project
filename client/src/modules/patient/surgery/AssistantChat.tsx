"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/helpers/cn";
import { getToken } from "@/lib/auth";
import { AssistantMessage, type AssistantChatMessage } from "@/modules/patient/surgery/AssistantMessage";
import type { AssistantIntentType } from "@/types/api";

type AssistantApiResponse = {
  intent?: AssistantIntentType;
  message?: string;
  data?: unknown;
  confidence?: number;
  suggestions?: string[];
};

function createMessageId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unable to reach the assistant right now. Please try again.";
}

async function parseAssistantResponse(response: Response): Promise<AssistantApiResponse> {
  try {
    return (await response.json()) as AssistantApiResponse;
  } catch {
    return {};
  }
}

const QUICK_PROMPTS = [
  "What is the price for cataract surgery?",
  "Tell me about dengue",
  "Are beds available?",
  "I want to book an appointment",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendMessage = async (overrideMessage?: string) => {
    const trimmedInput = (overrideMessage ?? input).trim();
    if (!trimmedInput || isSending) return;

    const loadingId = createMessageId();
    const token = getToken();

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: createMessageId(), role: "user", content: trimmedInput },
      { id: loadingId, role: "assistant", content: "Analyzing your query...", status: "loading" },
    ]);
    if (!overrideMessage) setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmedInput }),
        cache: "no-store",
      });

      if (!response.ok) {
        const errorPayload = await parseAssistantResponse(response);
        throw new Error(errorPayload.message ?? `Request failed with status ${response.status}`);
      }

      const payload = await parseAssistantResponse(response);
      const structuredData = payload.data ?? null;
      const reply = payload.message ?? "Here is what I found.";

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === loadingId
            ? {
                id: loadingId,
                role: "assistant",
                content: reply,
                structuredData,
                status: "done",
                intent: payload.intent,
                confidence: payload.confidence,
                suggestions: payload.suggestions,
              }
            : message
        )
      );
    } catch (error) {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === loadingId
            ? {
                id: loadingId,
                role: "assistant",
                content: getErrorMessage(error),
                status: "error",
              }
            : message
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleSuggestionClick = (suggestion: string) => {
    void sendMessage(suggestion);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex min-h-[36rem] flex-col">
        <CardHeader
          title="AI Assistant"
          description="Ask about surgery planning, disease info, pricing, bed availability, or appointments."
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Validated
            </div>
          }
          className="mb-0 border-b border-border px-6 py-5"
        />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
          {messages.length === 0 ? (
            <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <div className="max-w-md space-y-3">
                <p className="text-base font-semibold text-slate-900">Start a conversation</p>
                <p className="text-sm leading-6 text-muted">
                  Ask about surgery planning, disease info, pricing, bed availability, or appointments. All responses are validated — no hallucination.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {QUICK_PROMPTS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSuggestionClick(chip)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-0 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur md:px-6">
          <form className="flex items-end gap-3" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="assistant-message">
              Ask the assistant
            </label>
            <textarea
              id="assistant-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask about surgery, diseases, pricing, beds, or appointments..."
              rows={2}
              className={cn(
                "min-h-12 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100",
                isSending ? "opacity-90" : ""
              )}
              disabled={isSending}
            />
            <Button type="submit" size="md" loading={isSending} className="shrink-0 px-5">
              <span className="inline-flex items-center gap-2">
                Send
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted">Press Enter to send. Use Shift + Enter for a new line.</p>
        </div>
      </div>
    </Card>
  );
}
