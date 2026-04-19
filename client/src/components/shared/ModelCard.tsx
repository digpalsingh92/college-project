"use client";

import { ReactNode } from "react";
import { Brain, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/helpers/cn";

export type ModelStatus = "idle" | "training" | "success" | "failed";

type ModelCardProps = {
  name: string;
  description: string;
  status: ModelStatus;
  lastTrainedAt: string;
  onTrain: () => void;
  onReload?: () => void;
  loading?: boolean;
  accent?: "blue" | "emerald" | "amber" | "violet";
  footer?: ReactNode;
};

const accentMap = {
  blue: {
    ring: "ring-blue-200",
    soft: "bg-blue-50 text-blue-700",
    badge: "bg-blue-600",
    glow: "from-blue-50/80",
  },
  emerald: {
    ring: "ring-emerald-200",
    soft: "bg-emerald-50 text-emerald-700",
    badge: "bg-emerald-600",
    glow: "from-emerald-50/80",
  },
  amber: {
    ring: "ring-amber-200",
    soft: "bg-amber-50 text-amber-700",
    badge: "bg-amber-500",
    glow: "from-amber-50/80",
  },
  violet: {
    ring: "ring-violet-200",
    soft: "bg-violet-50 text-violet-700",
    badge: "bg-violet-600",
    glow: "from-violet-50/80",
  },
} as const;

const statusMap: Record<ModelStatus, { label: string; className: string }> = {
  idle: { label: "Idle", className: "bg-slate-100 text-slate-700" },
  training: { label: "Training", className: "bg-blue-100 text-blue-700" },
  success: { label: "Success", className: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Failed", className: "bg-rose-100 text-rose-700" },
};

export function ModelCard({
  name,
  description,
  status,
  lastTrainedAt,
  onTrain,
  onReload,
  loading = false,
  accent = "blue",
  footer,
}: ModelCardProps) {
  const accentStyles = accentMap[accent];
  const statusStyles = statusMap[status];
  const hasReload = typeof onReload === "function";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        accentStyles.ring
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-white opacity-80", accentStyles.glow)} />

      <div className="relative z-10 flex h-full flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm", accentStyles.badge)}>
            <Brain className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">{name}</h3>
              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles.className)}>
                {statusStyles.label}
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-slate-50/80 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Last trained</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{lastTrainedAt}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Current state</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {status === "training" ? "Inference queue paused" : "Ready for action"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="admin"
            type="button"
            onClick={onTrain}
            loading={loading && status === "training"}
            disabled={loading}
            className="min-w-32"
          >
            <span className="inline-flex items-center gap-2">
              {loading && status === "training" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Train Model
            </span>
          </Button>

          {hasReload ? (
            <Button
              variant="outline"
              type="button"
              onClick={onReload}
              loading={loading && status === "training"}
              disabled={loading}
              className="min-w-32"
            >
              <span className="inline-flex items-center gap-2">
                {loading && status === "training" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Reload Model
              </span>
            </Button>
          ) : null}
        </div>

        {footer ? <div className="pt-1">{footer}</div> : null}
      </div>
    </article>
  );
}
