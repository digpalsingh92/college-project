import { CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/helpers/cn";
import type { SlotRecommendationDto } from "@/types/api";

interface SlotCardProps {
  slot: SlotRecommendationDto;
  selected?: boolean;
  onSelect: () => void;
}

const labelStyles: Record<SlotRecommendationDto["label"], string> = {
  recommended: "border-emerald-200 bg-emerald-50 text-emerald-900",
  normal: "border-slate-200 bg-white text-slate-900",
  avoid: "border-red-200 bg-red-50 text-red-900",
};

export function SlotCard({ slot, selected = false, onSelect }: SlotCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-all hover:-translate-y-px hover:shadow-sm",
        labelStyles[slot.label],
        selected && "ring-2 ring-emerald-500 ring-offset-1"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{slot.time}</p>
          <p className="mt-1 text-sm text-current/80">⏳ {slot.estimatedWait} mins</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
          {slot.label === "recommended" ? <CheckCircle2 className="h-4 w-4" /> : null}
          {slot.label === "avoid" ? <TriangleAlert className="h-4 w-4" /> : null}
          <span>{slot.label}</span>
        </div>
      </div>
    </button>
  );
}
