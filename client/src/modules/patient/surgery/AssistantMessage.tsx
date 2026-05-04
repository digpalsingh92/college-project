"use client";

import {
  Activity, Bot, BedDouble, Clock3, DollarSign, Loader2, UserRound,
  Stethoscope, Calendar, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { cn } from "@/helpers/cn";
import type { AssistantIntentType } from "@/types/api";

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredData?: unknown;
  status?: "loading" | "error" | "done";
  intent?: AssistantIntentType;
  confidence?: number;
  suggestions?: string[];
}

interface StructuredCard {
  title: string;
  value: string;
  subtitle?: string;
  badge?: string;
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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

  // ── Disease info ──
  const disease = typeof root.disease === "string" ? root.disease : null;
  const severity = typeof root.severity === "string" ? root.severity : null;
  const requiresSurgery = root.requiresSurgery === true;
  const precautions = Array.isArray(root.precautions) ? root.precautions : [];
  const diseaseSymptoms = Array.isArray(root.symptoms) ? root.symptoms : [];
  const topCandidates = Array.isArray(root.topCandidates) ? root.topCandidates : [];
  const mode = typeof root.mode === "string" ? root.mode : null;

  if (disease && disease !== "Unknown" && mode) {
    cards.push({
      title: "Condition",
      value: disease,
      subtitle: severity ? `Severity: ${severity}` : undefined,
      badge: requiresSurgery ? "Surgery may be needed" : "No surgery required",
      accentClassName: "border-rose-100 bg-rose-50 text-rose-700",
      icon: Stethoscope,
    });

    if (diseaseSymptoms.length > 0) {
      cards.push({
        title: "Symptoms",
        value: diseaseSymptoms.slice(0, 4).join(", "),
        subtitle: diseaseSymptoms.length > 4 ? `+${diseaseSymptoms.length - 4} more` : undefined,
        accentClassName: "border-amber-100 bg-amber-50 text-amber-700",
        icon: Activity,
      });
    }

    if (precautions.length > 0) {
      cards.push({
        title: "Precautions",
        value: precautions[0] as string,
        subtitle: precautions.length > 1 ? precautions.slice(1, 3).join(" • ") : undefined,
        accentClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
        icon: ShieldCheck,
      });
    }

    if (topCandidates.length > 1) {
      const breakdown = topCandidates
        .filter((c): c is { disease?: string; confidence?: number } => Boolean(c && typeof c === "object"))
        .slice(0, 3)
        .map((c) => {
          const d = typeof c.disease === "string" ? c.disease : "Unknown";
          const conf = typeof c.confidence === "number" ? Math.round(c.confidence * 100) : 0;
          return `${d} ${conf}%`;
        })
        .join(" • ");

      if (breakdown) {
        cards.push({
          title: "Other possibilities",
          value: breakdown,
          accentClassName: "border-slate-200 bg-slate-50 text-slate-700",
          icon: Activity,
        });
      }
    }

    return cards; // Return early — disease cards only
  }

  // ── Wait time recommendations ──
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

  // ── Price ──
  const costRange = toRecord(root.estimatedCostRange) ?? root;
  const min = pickNumber(costRange.min, root.min);
  const max = pickNumber(costRange.max, root.max);
  const avg = pickNumber(costRange.avg, root.avg);
  const median = pickNumber(costRange.median, root.median);
  const procedure = typeof root.procedure === "string" ? root.procedure : typeof costRange.procedure === "string" ? costRange.procedure : null;

  if (min !== null || max !== null || avg !== null || median !== null) {
    const range = [min, max].filter((v): v is number => v !== null);
    cards.push({
      title: procedure ? `${procedure} cost` : "Estimated cost",
      value: range.length === 2 ? `${formatCurrency(range[0])} - ${formatCurrency(range[1])}` : avg !== null ? formatCurrency(avg) : "Estimate unavailable",
      subtitle: avg !== null || median !== null
        ? [avg !== null ? `Avg ${formatCurrency(avg)}` : null, median !== null ? `Median ${formatCurrency(median)}` : null].filter(Boolean).join(" • ")
        : undefined,
      accentClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
      icon: DollarSign,
    });
  }

  // ── Wait time days ──
  const waitDays = pickNumber(root.waitingDays, root.waitTimeDays, root.avgWaitTime, root.days, root.waitTime);
  const waitLabel = typeof root.waitingLabel === "string" ? root.waitingLabel : typeof root.delayLevel === "string" ? root.delayLevel : null;

  if (waitDays !== null) {
    cards.push({
      title: "Wait time",
      value: `${formatNumber(waitDays)} days`,
      subtitle: waitLabel ? `${waitLabel} urgency` : undefined,
      badge: waitLabel ? `${waitLabel} urgency` : undefined,
      accentClassName: "border-amber-100 bg-amber-50 text-amber-700",
      icon: Clock3,
    });
  }

  // ── Surgery plan ──
  const surgeryType = typeof root.surgeryType === "string" ? root.surgeryType : null;
  const surgeryDuration = typeof root.surgeryDuration === "string" ? root.surgeryDuration : null;
  const recoveryDays = pickNumber(root.recoveryDays);
  const confidence = pickNumber(root.confidence);

  if (surgeryType || surgeryDuration || recoveryDays !== null) {
    cards.push({
      title: surgeryType ? `${surgeryType} plan` : "Surgery plan",
      value: surgeryDuration ? `Duration: ${surgeryDuration}` : "Plan generated",
      subtitle: recoveryDays !== null || confidence !== null
        ? [
            recoveryDays !== null ? `Recovery ${formatNumber(recoveryDays)} days` : null,
            confidence !== null ? `Confidence ${Math.round(confidence * 100)}%` : null,
          ].filter(Boolean).join(" • ")
        : undefined,
      accentClassName: "border-violet-100 bg-violet-50 text-violet-700",
      icon: Activity,
    });
  }

  // ── Bed availability ──
  const bedAvailability = toRecord(root.bedAvailability) ?? root;
  const totalBeds = pickNumber(bedAvailability.totalBeds, root.totalBeds);
  const freeBeds = pickNumber(bedAvailability.freeBeds, bedAvailability.available, root.freeBeds, root.available);
  const occupancyRate = pickNumber(bedAvailability.occupancyRate, root.occupancyRate);

  if (totalBeds !== null || freeBeds !== null || occupancyRate !== null) {
    const details = [
      totalBeds !== null ? `${totalBeds} total` : null,
      freeBeds !== null ? `${freeBeds} free` : null,
      occupancyRate !== null ? `${formatNumber(occupancyRate * 100)}% occupied` : null,
    ].filter(Boolean).join(" • ");

    cards.push({
      title: typeof root.department === "string" ? `${root.department} beds` : "Bed availability",
      value: freeBeds !== null ? `${freeBeds} beds free` : totalBeds !== null ? `${totalBeds} beds total` : "Status updated",
      subtitle: details || undefined,
      accentClassName: "border-sky-100 bg-sky-50 text-sky-700",
      icon: BedDouble,
    });
  }

  // ── Booking ──
  const bookingStep = typeof root.step === "string" ? root.step : null;
  const requiredFields = Array.isArray(root.requiredFields) ? root.requiredFields : [];

  if (bookingStep) {
    cards.push({
      title: "Appointment",
      value: bookingStep === "info_provided" ? "Ready to book" : "More info needed",
      subtitle: requiredFields.length > 0 ? `Need: ${requiredFields.join(", ")}` : undefined,
      badge: bookingStep === "info_provided" ? "Ready" : "Pending",
      accentClassName: "border-indigo-100 bg-indigo-50 text-indigo-700",
      icon: Calendar,
    });
  }

  return cards;
}

// ── Intent label map ──
const INTENT_LABELS: Record<string, string> = {
  surgery_plan: "Surgery",
  disease_info: "Disease",
  price_estimate: "Price",
  bed_availability: "Beds",
  wait_time: "Wait Time",
  appointment_booking: "Booking",
  clarification: "Clarify",
};

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

interface AssistantMessageProps {
  message: AssistantChatMessage;
  onSuggestionClick?: (suggestion: string) => void;
}

export function AssistantMessage({ message, onSuggestionClick }: AssistantMessageProps) {
  const isUser = message.role === "user";
  const cards = message.role === "assistant" && message.status !== "loading" ? buildStructuredCards(message.structuredData) : [];
  const intentLabel = message.intent ? INTENT_LABELS[message.intent] : undefined;
  const isClarification = message.intent === "clarification";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? <MessageAvatar role="assistant" status={message.status} /> : null}

      <div className={cn("max-w-[min(46rem,85%)]", isUser ? "order-first" : "")}>
        {/* Intent + Confidence indicators */}
        {!isUser && message.status === "done" && (intentLabel || message.confidence) && (
          <div className="flex items-center gap-2 mb-1 px-1">
            {intentLabel && (
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                {intentLabel}
              </span>
            )}
            {message.confidence !== undefined && message.confidence > 0 && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                message.confidence >= 0.7 ? "bg-emerald-50 text-emerald-700"
                  : message.confidence >= 0.4 ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700"
              )}>
                <ShieldCheck className="h-2.5 w-2.5" />
                {Math.round(message.confidence * 100)}%
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl border px-4 py-3 shadow-sm",
            isUser
              ? "border-emerald-600 bg-emerald-600 text-white"
              : isClarification
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-border bg-surface text-foreground"
          )}
        >
          {message.status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your query...
            </div>
          ) : (
            <p className={cn("whitespace-pre-wrap text-sm leading-6", isUser ? "text-white" : isClarification ? "text-amber-900" : "text-foreground")}>
              {message.content}
            </p>
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
                        {card.badge ? (
                          <span className="mt-2 inline-flex rounded-full border border-current/20 bg-white/80 px-2 py-0.5 text-[11px] font-medium">
                            {card.badge}
                          </span>
                        ) : null}
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

        {/* Suggestion chips */}
        {!isUser && message.status === "done" && message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
          <div className="flex flex-wrap gap-1.5 mt-2 px-1">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {isUser ? <MessageAvatar role="user" /> : null}
    </div>
  );
}
