import type { LucideIcon } from "lucide-react";
import { cn } from "@/helpers/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  icon: LucideIcon;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  trend,
  trendPositive = true,
  icon: Icon,
  iconClassName,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {trend ? (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trendPositive ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {trend}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconClassName ?? "bg-slate-100 text-slate-600"
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
