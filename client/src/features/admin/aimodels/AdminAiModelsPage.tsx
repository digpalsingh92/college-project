"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowRight, Clock3, Layers3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ModelCard, type ModelStatus } from "@/components/shared/ModelCard";
import { cn } from "@/helpers/cn";
import { aiModelApi as modelApi } from "@/lib/api/index";

type ModelKey = "waitTime" | "noShow" | "price" | "bed" | "disease";

type ModelState = {
  status: ModelStatus;
  lastTrainedAt: string;
  loading: boolean;
};

type LogEntry = {
  id: string;
  modelKey: ModelKey;
  title: string;
  action: string;
  message: string;
  tone: "success" | "error" | "info";
  timestamp: string;
};

const modelMeta: Record<
  ModelKey,
  {
    name: string;
    description: string;
    accent: "blue" | "emerald" | "amber" | "violet";
    hasReload: boolean;
  }
> = {
  waitTime: {
    name: "Wait Time Model",
    description: "Forecasts appointment wait times and keeps scheduling operations predictable.",
    accent: "blue",
    hasReload: true,
  },
  noShow: {
    name: "No-show Model",
    description: "Predicts likely no-shows so staff can intervene before missed appointments occur.",
    accent: "emerald",
    hasReload: false,
  },
  price: {
    name: "Price Prediction Model",
    description: "Estimates treatment pricing from historical billing and clinical patterns.",
    accent: "amber",
    hasReload: false,
  },
  bed: {
    name: "Bed Availability Model",
    description: "Assesses ward and department capacity to support operational planning.",
    accent: "violet",
    hasReload: false,
  },
  disease: {
    name: "Disease Prediction Model",
    description: "Trains on symptoms and clinical datasets to improve diagnostic assistants.",
    accent: "emerald",
    hasReload: false,
  },
};

const initialModelState: Record<ModelKey, ModelState> = {
  waitTime: { status: "idle", lastTrainedAt: "2 hours ago", loading: false },
  noShow: { status: "idle", lastTrainedAt: "5 hours ago", loading: false },
  price: { status: "idle", lastTrainedAt: "1 day ago", loading: false },
  bed: { status: "idle", lastTrainedAt: "12 hours ago", loading: false },
  disease: { status: "idle", lastTrainedAt: "New", loading: false },
};

const initialLogs: LogEntry[] = [
  {
    id: "seed-1",
    modelKey: "waitTime",
    title: "Wait Time Model",
    action: "Loaded dashboard state",
    message: "Model snapshots loaded successfully.",
    tone: "info",
    timestamp: "Just now",
  },
];

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatRelativeTime(date: Date): string {
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function createNowStamp(): string {
  return formatRelativeTime(new Date());
}

export function AdminAiModelsPage() {
  const [modelState, setModelState] = useState<Record<ModelKey, ModelState>>(initialModelState);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);

  const globalLoading = Object.values(modelState).some((item) => item.loading);

  const modelCount = Object.keys(modelMeta).length;
  const successCount = Object.values(modelState).filter((item) => item.status === "success").length;

  const orderedModels = useMemo(
    () => Object.entries(modelMeta) as Array<[ModelKey, (typeof modelMeta)[ModelKey]]>,
    []
  );

  async function handleAction(
    modelKey: ModelKey,
    action: "train" | "reload",
    request: () => Promise<string>
  ) {
    const actionKey = `${action}:${modelKey}`;

    setModelState((previous) => ({
      ...previous,
      [modelKey]: {
        ...previous[modelKey],
        loading: true,
        status: "training",
      },
    }));

    try {
      const message = await request();

      const nextStamp = createNowStamp();
      setModelState((previous) => ({
        ...previous,
        [modelKey]: {
          ...previous[modelKey],
          loading: false,
          status: "success",
          lastTrainedAt: nextStamp,
        },
      }));

      const entry: LogEntry = {
        id: `${actionKey}-${Date.now()}`,
        modelKey,
        title: modelMeta[modelKey].name,
        action: action === "train" ? "Training completed" : "Model reloaded",
        message: message || `${modelMeta[modelKey].name} completed successfully.`,
        tone: "success",
        timestamp: formatTimestamp(new Date()),
      };

      setLogs((previous) => [entry, ...previous].slice(0, 6));
      toast.success(message || `${modelMeta[modelKey].name} completed successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed. Please try again.";
      setModelState((previous) => ({
        ...previous,
        [modelKey]: {
          ...previous[modelKey],
          loading: false,
          status: "failed",
        },
      }));

      const failedLog: LogEntry = {
          id: `${actionKey}-${Date.now()}`,
          modelKey,
          title: modelMeta[modelKey].name,
          action: action === "train" ? "Training failed" : "Reload failed",
          message,
          tone: "error",
          timestamp: formatTimestamp(new Date()),
      };

      setLogs((previous) => [failedLog, ...previous].slice(0, 6));

      toast.error(message);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-slate-900 via-blue-900 to-cyan-800 p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin only
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Model Control Panel</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/90 sm:text-base">
                Centralize AI model training and deployment operations from a single secure dashboard.
                Track each model state, launch training jobs, reload the main wait-time model, and review the latest operational logs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-70">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.16em] text-blue-100/80">Models</p>
              <p className="mt-2 text-2xl font-semibold">{modelCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.16em] text-blue-100/80">Ready</p>
              <p className="mt-2 text-2xl font-semibold">{successCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">Model operations</p>
              <p className="text-sm text-slate-500">Only admin-approved training endpoints are exposed here.</p>
            </div>
            {globalLoading ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <Activity className="h-4 w-4 animate-pulse" />
                Training in progress
              </span>
            ) : null}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {orderedModels.map(([key, meta]) => {
              const state = modelState[key];

              return (
                <ModelCard
                  key={key}
                  name={meta.name}
                  description={meta.description}
                  status={state.status}
                  lastTrainedAt={state.lastTrainedAt}
                  accent={meta.accent}
                  loading={state.loading}
                  onTrain={() =>
                    handleAction(
                      key,
                      "train",
                      key === "waitTime"
                        ? modelApi.trainWaitTimeModel
                        : key === "noShow"
                          ? modelApi.trainNoShowModel
                          : key === "price"
                            ? modelApi.trainPriceModel
                            : key === "bed"
                              ? modelApi.trainBedModel
                              : modelApi.trainDiseaseModel
                    )
                  }
                  onReload={
                    meta.hasReload
                      ? () => handleAction(key, "reload", modelApi.reloadWaitTimeModel)
                      : undefined
                  }
                  footer={
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      Updated {state.lastTrainedAt}
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-blue-700" />
              <h2 className="text-base font-semibold text-slate-900">Recent actions</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">Live activity feed for training and reload events.</p>

            <div className="mt-4 space-y-3">
              {logs.length > 0 ? (
                logs.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                        <p className="text-xs text-slate-500">{entry.action}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          entry.tone === "success" && "bg-emerald-50 text-emerald-700",
                          entry.tone === "error" && "bg-rose-50 text-rose-700",
                          entry.tone === "info" && "bg-blue-50 text-blue-700"
                        )}
                      >
                        {entry.timestamp}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{entry.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  No recent training activity yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Operational notes</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                Training and reload actions are routed through secured admin endpoints.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                The main wait-time model supports both training and reload because it is the deployed core model.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                Status is tracked per model so operators can see idle, training, success, and failed states immediately.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
