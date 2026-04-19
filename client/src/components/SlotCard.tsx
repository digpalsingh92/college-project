"use client";

import { cn } from "@/helpers/cn";
import type { WaitLevel } from "@/types/api";

type SlotCardProps = {
  time: string;
  waitTime: number;
  waitLevel: WaitLevel;
  isRecommended?: boolean;
  isAvoid?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

const WAIT_STYLES: Record<WaitLevel, { badge: string; label: string; dot: string }> = {
  low: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Low wait",
    dot: "bg-emerald-500",
  },
  moderate: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Moderate wait",
    dot: "bg-amber-500",
  },
  high: {
    badge: "bg-red-50 text-red-700 border-red-200",
    label: "High wait",
    dot: "bg-red-500",
  },
};

export function SlotCard({
  time,
  waitTime,
  waitLevel,
  isRecommended = false,
  isAvoid = false,
  selected = false,
  disabled = false,
  onSelect,
}: SlotCardProps) {
  const waitStyle = WAIT_STYLES[waitLevel];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        disabled ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70" : "hover:border-slate-300",
        selected ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-200" : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">{time}</p>
          <p className="text-xs text-slate-600">Estimated wait: {waitTime} mins</p>
        </div>

        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs", waitStyle.badge)}>
          <span className={cn("h-2 w-2 rounded-full", waitStyle.dot)} aria-hidden />
          {waitStyle.label}
        </span>
      </div>

      {(isRecommended || isAvoid) && !disabled ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isRecommended ? (
            <span className="inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white">
              Recommended Slot
            </span>
          ) : null}
          {isAvoid ? (
            <span className="inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
              Avoid Slot
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
