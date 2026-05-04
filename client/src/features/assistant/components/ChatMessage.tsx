import { cn } from "@/helpers/cn";
import { Bot, User, ShieldCheck } from "lucide-react";
import type { AssistantIntentType } from "@/types/api";
import { ResponseCard } from "./ResponseCard";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "price" | "wait-time" | "bed" | "surgery-plan" | "disease" | "clarification" | "booking" | "general";
  data?: Record<string, unknown> | null;
  confidence?: number;
  suggestions?: string[];
  intent?: AssistantIntentType;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onSuggestionClick?: (suggestion: string) => void;
}

const INTENT_LABELS: Record<string, string> = {
  surgery_plan: "Surgery Plan",
  disease_info: "Disease Info",
  price_estimate: "Price Estimate",
  bed_availability: "Beds",
  wait_time: "Wait Time",
  appointment_booking: "Booking",
  clarification: "Clarification",
};

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === "user";
  const intentLabel = message.intent ? INTENT_LABELS[message.intent] : undefined;
  const confidence = message.confidence;

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-1",
            isUser
              ? "bg-blue-600 ring-blue-700 text-white"
              : "bg-white ring-slate-200 text-slate-600"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col gap-1.5">
          {/* Intent + Confidence Badge */}
          {!isUser && (intentLabel || (confidence !== undefined && confidence > 0)) && (
            <div className="flex items-center gap-2 px-1">
              {intentLabel && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                  {intentLabel}
                </span>
              )}
              {confidence !== undefined && confidence > 0 && (
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  confidence >= 0.7
                    ? "bg-emerald-50 text-emerald-700"
                    : confidence >= 0.4
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                )}>
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {Math.round(confidence * 100)}%
                </span>
              )}
            </div>
          )}

          <div
            className={cn(
              "rounded-2xl px-5 py-3.5 text-[0.95rem] leading-relaxed shadow-sm",
              isUser
                ? "bg-blue-600 text-white rounded-tr-sm"
                : message.type === "clarification"
                  ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm"
                  : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm ring-1 ring-black/5"
            )}
          >
            {message.content}
          </div>

          {/* Structured Data Cards */}
          {!isUser &&
            message.type &&
            typeof message.data === "object" &&
            message.data !== null && (
              <ResponseCard
                type={message.type}
                data={message.data as Record<string, unknown>}
              />
            )}

          {/* Suggestion Chips */}
          {!isUser && message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
            <div className="flex flex-wrap gap-1.5 mt-1 px-1">
              {message.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
