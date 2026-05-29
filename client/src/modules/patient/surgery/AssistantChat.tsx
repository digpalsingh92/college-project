"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bot, SendHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/helpers/cn";
import { getToken } from "@/lib/auth";
import { AssistantMessage, type AssistantChatMessage } from "@/modules/patient/surgery/AssistantMessage";

type AssistantApiResponse = {
  message?: string;
  data?: unknown;
  structuredData?: unknown;
  result?: unknown;
  intent?: string;
  type?: string;
};

const SUGGESTED_PROMPTS = [
  "What is the cost of cataract surgery?",
  "How long is the wait time?",
  "Do you have beds available?",
];

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

export function AssistantChat() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText !== undefined ? messageText : input;
    const trimmedInput = textToSend.trim();
    if (!trimmedInput || isSending) return;

    const loadingId = createMessageId();
    const token = getToken();

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: createMessageId(), role: "user", content: trimmedInput },
      { id: loadingId, role: "assistant", content: "Thinking...", status: "loading" },
    ]);
    
    if (messageText === undefined) {
      setInput("");
    }
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
      const structuredData = payload.data ?? payload.structuredData ?? payload.result ?? null;
      const reply = payload.message ?? "Here is what I found.";

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === loadingId
            ? {
                id: loadingId,
                role: "assistant",
                content: reply,
                structuredData,
                intent: payload.intent,
                status: "done",
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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">AI Patient Assistant</h2>
          <p className="text-xs text-slate-500">Ask about pricing, wait times, or bed availability</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
              <Bot className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">How can I help you?</h3>
              <p className="mt-1 text-sm text-slate-500">Select a suggestion below or type your question.</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm mt-4">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[0.95rem] text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((message) => (
              <AssistantMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="mx-auto max-w-3xl">
          <form className="relative flex w-full items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500" onSubmit={handleSubmit}>
            <textarea
              id="assistant-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              disabled={isSending}
              placeholder="Ask about price, wait time, or bed availability..."
              className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[0.95rem] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
              rows={1}
              style={{ overflowY: input.split('\n').length > 1 ? 'auto' : 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <Button
              type="submit"
              size="sm"
              className="h-10 w-10 shrink-0 rounded-xl px-0 py-0 flex items-center justify-center"
              disabled={!input.trim() || isSending}
            >
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-slate-400">Press Enter to send. Use Shift + Enter for a new line.</p>
        </div>
      </div>
    </div>
  );
}
