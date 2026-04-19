"use client";

import { Bot, BedDouble, Clock3, DollarSign, Loader2, UserRound } from "lucide-react";
import { cn } from "@/helpers/cn";

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredData?: unknown;
  status?: "loading" | "error" | "done";
}

interface StructuredCard {
  title: string;
  value: string;
  subtitle?: string;
  accentClassName: string;
  icon: typeof DollarSign;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numberValue = toNumber(value);
    if (numberValue !== null) return numberValue;
  }
  return null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function buildStructuredCards(payload: unknown): StructuredCard[] {
  const root = toRecord(payload);
  if (!root) return [];

  const cards: StructuredCard[] = [];
  const bestTime = typeof root.bestTime === "string" ? root.bestTime : null;
  const worstTime = typeof root.worstTime === "string" ? root.worstTime : null;
  const recommendationMessage = typeof root.message === "string" ? root.message : null;

  if (bestTime || worstTime || recommendationMessage) {
    cards.push({
      title: "Wait guidance",
      value: bestTime ? `Best: ${bestTime}` : "Wait guidance",
      subtitle: [worstTime ? `Worst: ${worstTime}` : null, recommendationMessage].filter(Boolean).join(" • ") || undefined,
      accentClassName: "border-sky-100 bg-sky-50 text-sky-700",
      icon: Clock3,
    });
  }

  const costRange = toRecord(root.estimatedCostRange) ?? root;
  const bedAvailability = toRecord(root.bedAvailability) ?? root;

  const min = pickNumber(costRange.min, root.min);
  const max = pickNumber(costRange.max, root.max);
  const avg = pickNumber(costRange.avg, root.avg);
  const median = pickNumber(costRange.median, root.median);
  const procedure = typeof root.procedure === "string" ? root.procedure : typeof costRange.procedure === "string" ? costRange.procedure : null;

  if (min !== null || max !== null || avg !== null || median !== null) {
    const range = [min, max].filter((value): value is number => value !== null);

    cards.push({
      title: procedure ? `${procedure} cost` : "Estimated cost",
      value: range.length === 2 ? `${formatCurrency(range[0])} - ${formatCurrency(range[1])}` : avg !== null ? formatCurrency(avg) : "Estimate unavailable",
      subtitle:
        avg !== null || median !== null
          ? [avg !== null ? `Avg ${formatCurrency(avg)}` : null, median !== null ? `Median ${formatCurrency(median)}` : null]
              .filter(Boolean)
              .join(" • ")
          : undefined,
      accentClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
      icon: DollarSign,
    });
  }

  const waitDays = pickNumber(root.waitingDays, root.waitTimeDays, root.avgWaitTime, root.days, root.waitTime);
  const waitLabel = typeof root.waitingLabel === "string" ? root.waitingLabel : typeof root.delayLevel === "string" ? root.delayLevel : null;

  if (waitDays !== null) {
    cards.push({
      title: "Wait time",
      value: `${formatNumber(waitDays)} days`,
      subtitle: waitLabel ? `${waitLabel} urgency` : undefined,
      accentClassName: "border-amber-100 bg-amber-50 text-amber-700",
      icon: Clock3,
    });
  }

  const totalBeds = pickNumber(bedAvailability.totalBeds, root.totalBeds);
  const freeBeds = pickNumber(bedAvailability.freeBeds, bedAvailability.available, root.freeBeds, root.available);
  const occupancyRate = pickNumber(bedAvailability.occupancyRate, root.occupancyRate);
  const icuAvailable = pickNumber(bedAvailability.icuAvailable, root.icuAvailable);
  const staffOnDuty = pickNumber(bedAvailability.staffOnDuty, root.staffOnDuty);

  if (totalBeds !== null || freeBeds !== null || occupancyRate !== null || icuAvailable !== null || staffOnDuty !== null) {
    const details = [
      totalBeds !== null ? `${totalBeds} total` : null,
      freeBeds !== null ? `${freeBeds} free` : null,
      occupancyRate !== null ? `${formatNumber(occupancyRate)}% occupied` : null,
      icuAvailable !== null ? `${icuAvailable} ICU` : null,
      staffOnDuty !== null ? `${staffOnDuty} staff` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    cards.push({
      title: typeof root.department === "string" ? `${root.department} beds` : "Bed availability",
      value: freeBeds !== null ? `${freeBeds} beds free` : totalBeds !== null ? `${totalBeds} beds total` : "Availability updated",
      subtitle: details || undefined,
      accentClassName: "border-sky-100 bg-sky-50 text-sky-700",
      icon: BedDouble,
    });
  }

  return cards;
}

function MessageAvatar({ role, status }: { role: "user" | "assistant"; status?: AssistantChatMessage["status"] }) {
  if (role === "assistant") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700">
      <UserRound className="h-4 w-4" />
    </div>
  );
}

export function AssistantMessage({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === "user";
  const cards = message.role === "assistant" && message.status !== "loading" ? buildStructuredCards(message.structuredData) : [];

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? <MessageAvatar role="assistant" status={message.status} /> : null}

      <div className={cn("max-w-[min(46rem,85%)]", isUser ? "order-first" : "")}>
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 shadow-sm",
            isUser ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-surface text-foreground"
          )}
        >
          {message.status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          ) : (
            <p className={cn("whitespace-pre-wrap text-sm leading-6", isUser ? "text-white" : "text-foreground")}>{message.content}</p>
          )}

          {message.role === "assistant" && cards.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <div key={`${message.id}-${card.title}`} className={cn("rounded-xl border p-3", card.accentClassName)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{card.title}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{card.value}</p>
                      </div>
                      <Icon className="h-4 w-4 shrink-0" />
                    </div>
                    {card.subtitle ? <p className="mt-2 text-xs text-muted">{card.subtitle}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {isUser ? <MessageAvatar role="user" /> : null}
    </div>
  );
}
