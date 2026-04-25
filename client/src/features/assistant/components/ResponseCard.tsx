import { AssistantResponse } from "@/types/api";
import { Bed, IndianRupee, Clock } from "lucide-react";
import { cn } from "@/helpers/cn";

interface ResponseCardProps {
  type: NonNullable<AssistantResponse["type"]>;
  data: Record<string, unknown>;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

export function ResponseCard({ type, data }: ResponseCardProps) {
  const record = toRecord(data);
  if (!record) return null;

  const estimatedCostRange = toRecord(record.estimatedCostRange);
  const bedData = toRecord(record.bedAvailability);
  const waitLabel = pickString(record.waitingLabel, record.delayLevel);
  const waitDays = pickNumber(record.waitingDays, record.waitTimeDays, record.avgWaitTime, record.days, record.waitTime);
  const priceRange = pickString(
    record.priceRange,
    estimatedCostRange?.formatted,
    typeof estimatedCostRange?.min === "number" && typeof estimatedCostRange?.max === "number"
      ? `INR ${estimatedCostRange.min} - INR ${estimatedCostRange.max}`
      : null
  );
  const bedSummary = pickString(
    record.bedsAvailable,
    typeof bedData?.freeBeds === "number" ? `${bedData.freeBeds} beds free` : null,
    typeof record.freeBeds === "number" ? `${record.freeBeds} beds free` : null
  );

  if (type === "price") {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-3 border-b border-blue-50 bg-blue-50/50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <IndianRupee className="h-4 w-4" />
          </div>
          <h4 className="font-medium text-blue-900">Price Estimate</h4>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-500">Estimated Range</span>
            <span className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              {priceRange ?? "Not available"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "wait-time") {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-3 border-b border-amber-50 bg-amber-50/50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
          <h4 className="font-medium text-amber-900">Wait Time Analysis</h4>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-500">Estimated Wait</span>
            <span className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              {waitDays !== null ? `${waitDays} days` : "Not available"}
            </span>
            {waitLabel ? (
              <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                {waitLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (type === "bed") {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-3 border-b border-emerald-50 bg-emerald-50/50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <Bed className="h-4 w-4" />
          </div>
          <h4 className="font-medium text-emerald-900">Bed Availability</h4>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-500">Status</span>
            <span className={cn(
              "mt-1 text-lg font-semibold tracking-tight",
              bedSummary?.toLowerCase().includes("free") || bedSummary?.toLowerCase().includes("available") ? "text-emerald-700" : "text-rose-700"
            )}>
              {bedSummary ?? "Not available"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
