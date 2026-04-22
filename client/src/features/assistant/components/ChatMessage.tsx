import { cn } from "@/helpers/cn";
import { Bot, User } from "lucide-react";
import { AssistantResponse } from "@/types/api";
import { ResponseCard } from "./ResponseCard";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: AssistantResponse["type"];
  data?: AssistantResponse["data"];
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

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
        <div className="flex flex-col">
          <div
            className={cn(
              "rounded-2xl px-5 py-3.5 text-[0.95rem] leading-relaxed shadow-sm",
              isUser
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm ring-1 ring-black/5"
            )}
          >
            {message.content}
          </div>

          {/* Structured Data Cards */}
          {!isUser && message.type && message.data && (
            <ResponseCard type={message.type as any} data={message.data} />
          )}
        </div>
      </div>
    </div>
  );
}
