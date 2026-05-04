"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatMessageData } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useAskAssistantMutation } from "@/store/apiSlice";
import { Bot, Sparkles, ShieldCheck } from "lucide-react";
import type { AssistantIntentType } from "@/types/api";

const SUGGESTED_PROMPTS = [
  "What is the cost of cataract surgery?",
  "Tell me about dengue",
  "Are beds available in orthopedics?",
  "I want to book an appointment",
];

function intentToUiType(intent: AssistantIntentType): ChatMessageData["type"] {
  switch (intent) {
    case "price_estimate": return "price";
    case "wait_time": return "wait-time";
    case "bed_availability": return "bed";
    case "surgery_plan": return "surgery-plan";
    case "disease_info": return "disease";
    case "clarification": return "clarification";
    case "appointment_booking": return "booking";
    default: return "general";
  }
}

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [askAssistant, { isLoading }] = useAskAssistantMutation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    const userMessage: ChatMessageData = {
      id: window.crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await askAssistant({ message: content }).unwrap();

      const aiMessage: ChatMessageData = {
        id: window.crypto.randomUUID(),
        role: "assistant",
        content: response.message || "Here is what I found:",
        type: intentToUiType(response.intent),
        data: response.data,
        confidence: response.confidence,
        suggestions: response.suggestions,
        intent: response.intent,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: ChatMessageData = {
        id: window.crypto.randomUUID(),
        role: "assistant",
        content: "I'm sorry, I encountered an error connecting to the system. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">AI Hospital Assistant</h2>
          <p className="text-xs text-slate-500">Deterministic routing • No hallucination</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          <ShieldCheck className="h-3 w-3" />
          Validated
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
                  onClick={() => handleSend(prompt)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[0.95rem] text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 hover:shadow-md active:scale-[0.98]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onSuggestionClick={handleSend} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400"></span>
                      </div>
                      <span className="ml-1">Analyzing your query...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
