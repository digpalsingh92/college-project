import { Bed, IndianRupee, Clock, Activity, Stethoscope, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/helpers/cn";

interface ResponseCardProps {
  type: "price" | "wait-time" | "bed" | "surgery-plan" | "disease" | "clarification" | "booking" | "general";
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Card renderers ──

function PriceCard({ data }: { data: Record<string, unknown> }) {
  const costRange = toRecord(data.estimatedCostRange) ?? data;
  const min = pickNumber(costRange.min, data.min);
  const max = pickNumber(costRange.max, data.max);
  const avg = pickNumber(costRange.avg, data.avg);
  const procedure = pickString(data.procedure, costRange.procedure);

  const rangeText = min !== null && max !== null
    ? `${formatCurrency(min)} – ${formatCurrency(max)}`
    : avg !== null
      ? formatCurrency(avg)
      : pickString(data.priceRange) ?? "Not available";

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-blue-50 bg-blue-50/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <IndianRupee className="h-4 w-4" />
        </div>
        <h4 className="font-medium text-blue-900">{procedure ? `${procedure} — Price` : "Price Estimate"}</h4>
      </div>
      <div className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500">Estimated Range</span>
          <span className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{rangeText}</span>
          {avg !== null && min !== null && (
            <span className="mt-1 text-xs text-slate-500">Average: {formatCurrency(avg)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitTimeCard({ data }: { data: Record<string, unknown> }) {
  const waitDays = pickNumber(data.waitingDays, data.avgWaitTime, data.days);
  const bestTime = pickString(data.bestTime);
  const worstTime = pickString(data.worstTime);
  const message = pickString(data.message);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-amber-50 bg-amber-50/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Clock className="h-4 w-4" />
        </div>
        <h4 className="font-medium text-amber-900">Wait Time Analysis</h4>
      </div>
      <div className="px-4 py-4 space-y-2">
        {waitDays !== null && (
          <div>
            <span className="text-sm font-medium text-slate-500">Estimated Wait</span>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{waitDays} days</p>
          </div>
        )}
        {bestTime && (
          <p className="text-sm text-slate-600"><span className="font-medium text-emerald-700">Best time:</span> {bestTime}</p>
        )}
        {worstTime && (
          <p className="text-sm text-slate-600"><span className="font-medium text-rose-700">Worst time:</span> {worstTime}</p>
        )}
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}

function BedCard({ data }: { data: Record<string, unknown> }) {
  const bedData = toRecord(data.bedAvailability) ?? data;
  const freeBeds = pickNumber(bedData.freeBeds, bedData.available, data.freeBeds);
  const totalBeds = pickNumber(bedData.totalBeds, data.totalBeds);
  const occupancyRate = pickNumber(bedData.occupancyRate, data.occupancyRate);
  const department = pickString(data.department, bedData.department);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-emerald-50 bg-emerald-50/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <Bed className="h-4 w-4" />
        </div>
        <h4 className="font-medium text-emerald-900">{department ? `${department} — Beds` : "Bed Availability"}</h4>
      </div>
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {freeBeds !== null && (
            <div>
              <span className="text-sm font-medium text-slate-500">Free Beds</span>
              <p className={cn("mt-1 text-lg font-semibold", freeBeds > 0 ? "text-emerald-700" : "text-rose-700")}>
                {freeBeds}
              </p>
            </div>
          )}
          {totalBeds !== null && (
            <div>
              <span className="text-sm font-medium text-slate-500">Total Beds</span>
              <p className="mt-1 text-lg font-semibold text-slate-900">{totalBeds}</p>
            </div>
          )}
          {occupancyRate !== null && (
            <div>
              <span className="text-sm font-medium text-slate-500">Occupancy</span>
              <p className="mt-1 text-lg font-semibold text-slate-900">{Math.round(occupancyRate * 100)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SurgeryPlanCard({ data }: { data: Record<string, unknown> }) {
  const costRange = toRecord(data.estimatedCostRange);
  const bedData = toRecord(data.bedAvailability);
  const surgeryType = pickString(data.surgeryType);
  const duration = pickString(data.surgeryDuration);
  const recoveryDays = pickNumber(data.recoveryDays);
  const waitingDays = pickNumber(data.waitingDays);
  const confidence = pickNumber(data.confidence);
  const min = pickNumber(costRange?.min);
  const max = pickNumber(costRange?.max);
  const freeBeds = pickNumber(bedData?.available);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-violet-50 bg-violet-50/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Activity className="h-4 w-4" />
        </div>
        <h4 className="font-medium text-violet-900">{surgeryType ? `${surgeryType} Plan` : "Surgery Plan"}</h4>
        {confidence !== null && (
          <span className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
            confidence >= 0.7 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          )}>
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 px-4 py-4">
        {duration && (
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</span>
            <p className="mt-1 text-sm font-semibold text-slate-900">{duration}</p>
          </div>
        )}
        {recoveryDays !== null && (
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recovery</span>
            <p className="mt-1 text-sm font-semibold text-slate-900">{recoveryDays} days</p>
          </div>
        )}
        {min !== null && max !== null && (
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cost Range</span>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(min)} – {formatCurrency(max)}</p>
          </div>
        )}
        {waitingDays !== null && (
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Wait Time</span>
            <p className="mt-1 text-sm font-semibold text-slate-900">{waitingDays} days</p>
          </div>
        )}
        {freeBeds !== null && (
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Beds Available</span>
            <p className={cn("mt-1 text-sm font-semibold", freeBeds > 0 ? "text-emerald-700" : "text-rose-700")}>
              {freeBeds}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DiseaseCard({ data }: { data: Record<string, unknown> }) {
  const disease = pickString(data.disease);
  const severity = pickString(data.severity);
  const requiresSurgery = data.requiresSurgery === true;
  const symptoms = Array.isArray(data.symptoms) ? data.symptoms.filter((s): s is string => typeof s === "string") : [];
  const precautions = Array.isArray(data.precautions) ? data.precautions.filter((s): s is string => typeof s === "string") : [];
  const confidence = pickNumber(data.confidence);
  const topCandidates = Array.isArray(data.topCandidates) ? data.topCandidates : [];

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-rose-50 bg-rose-50/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
          <Stethoscope className="h-4 w-4" />
        </div>
        <h4 className="font-medium text-rose-900">{disease ?? "Disease Information"}</h4>
        {severity && (
          <span className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
            severity === "severe" ? "bg-red-100 text-red-700"
              : severity === "moderate" ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
          )}>
            {severity}
          </span>
        )}
      </div>
      <div className="px-4 py-4 space-y-3">
        {confidence !== null && (
          <p className="text-xs text-slate-500">Confidence: {Math.round(confidence * 100)}%</p>
        )}
        <p className="text-xs font-medium text-slate-700">
          Surgery required: <span className={requiresSurgery ? "text-rose-600" : "text-emerald-600"}>{requiresSurgery ? "Yes" : "No"}</span>
        </p>
        {symptoms.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Symptoms</p>
            <div className="flex flex-wrap gap-1">
              {symptoms.map((s) => (
                <span key={s} className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] text-rose-700">{s}</span>
              ))}
            </div>
          </div>
        )}
        {precautions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Precautions</p>
            <ul className="list-disc list-inside space-y-0.5">
              {precautions.map((p) => (
                <li key={p} className="text-xs text-slate-600">{p}</li>
              ))}
            </ul>
          </div>
        )}
        {topCandidates.length > 1 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Other Possibilities</p>
            <div className="flex flex-wrap gap-1">
              {topCandidates.slice(0, 3).map((c: unknown) => {
                const candidate = c as { disease?: string; confidence?: number };
                return candidate.disease ? (
                  <span key={candidate.disease} className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                    {candidate.disease} {candidate.confidence !== undefined ? `${Math.round(candidate.confidence * 100)}%` : ""}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClarificationCard({ data }: { data: Record<string, unknown> }) {
  const options = Array.isArray(data.options) ? data.options.filter((o): o is string => typeof o === "string") : [];

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <h4 className="font-medium text-amber-900">Clarification Needed</h4>
      </div>
      {options.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-amber-700 mb-2">Did you mean one of these?</p>
          <div className="flex flex-wrap gap-1.5">
            {options.map((option) => (
              <span key={option} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800">
                {option}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ data }: { data: Record<string, unknown> }) {
  const step = pickString(data.step);
  const requiredFields = Array.isArray(data.requiredFields) ? data.requiredFields.filter((f): f is string => typeof f === "string") : [];

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-indigo-50 bg-indigo-50/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <Calendar className="h-4 w-4" />
        </div>
        <h4 className="font-medium text-indigo-900">Appointment Booking</h4>
        {step && (
          <span className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
            step === "info_provided" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          )}>
            {step === "info_provided" ? "Ready" : "Info needed"}
          </span>
        )}
      </div>
      {requiredFields.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Still needed</p>
          <div className="flex flex-wrap gap-1.5">
            {requiredFields.map((f) => (
              <span key={f} className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] text-indigo-700">{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ──

export function ResponseCard({ type, data }: ResponseCardProps) {
  if (!data) return null;

  switch (type) {
    case "price": return <PriceCard data={data} />;
    case "wait-time": return <WaitTimeCard data={data} />;
    case "bed": return <BedCard data={data} />;
    case "surgery-plan": return <SurgeryPlanCard data={data} />;
    case "disease": return <DiseaseCard data={data} />;
    case "clarification": return <ClarificationCard data={data} />;
    case "booking": return <BookingCard data={data} />;
    default: return null;
  }
}
