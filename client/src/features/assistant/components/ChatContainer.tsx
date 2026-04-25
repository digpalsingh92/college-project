"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatMessageData } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useAskAssistantMutation } from "@/store/apiSlice";
import { Bot, Sparkles } from "lucide-react";

const SUGGESTED_PROMPTS = [
  "What is the cost of cataract surgery?",
  "How long is the wait time?",
  "Do you have beds available?",
];

function toUiType(intent: string): "price" | "wait-time" | "bed" | "general" {
  if (intent === "price") return "price";
  if (intent === "wait-time" || intent === "recommendations" || intent === "surgery-plan") return "wait-time";
  if (intent === "bed") return "bed";
  return "general";
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
        type: response.type ?? toUiType(response.intent),
        data: response.data,
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
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">AI Hospital Assistant</h2>
          <p className="text-xs text-slate-500">Connected to secure backend APIs</p>
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
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[0.95rem] text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></span>
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
