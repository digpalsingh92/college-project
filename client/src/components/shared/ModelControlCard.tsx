import { Brain, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ModelControlCardProps {
  title: string;
  description: string;
  onTrain: () => void;
  onReload?: () => void;
  training: boolean;
  reloading?: boolean;
  disableActions?: boolean;
}

export function ModelControlCard({
  title,
  description,
  onTrain,
  onReload,
  training,
  reloading = false,
  disableActions = false,
}: ModelControlCardProps) {
  const isBusy = training || reloading;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-teal-50/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 space-y-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="admin"
            type="button"
            onClick={onTrain}
            loading={training}
            disabled={disableActions || isBusy}
            className="min-w-32"
          >
            {training ? "Training..." : "Train Model"}
          </Button>

          {onReload ? (
            <Button
              variant="outline"
              type="button"
              onClick={onReload}
              loading={reloading}
              disabled={disableActions || isBusy}
              className="min-w-32"
            >
              <span className="inline-flex items-center gap-1.5">
                {reloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Reload Model
              </span>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
