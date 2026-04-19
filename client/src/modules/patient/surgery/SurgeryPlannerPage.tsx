"use client";

import { useState } from "react";
import {
  Scissors,
  DollarSign,
  BedDouble,
  Clock,
  Heart,
  Activity,
  Eye,
  Bone,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useGetSurgeryPlanMutation } from "@/store/apiSlice";
import type { SurgeryPlanResponse } from "@/types/api";

interface SurgeryOption {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SURGERIES: SurgeryOption[] = [
  { key: "knee_replacement", label: "Knee Replacement", icon: Bone, description: "Total or partial knee arthroplasty" },
  { key: "cataract", label: "Cataract Surgery", icon: Eye, description: "Lens replacement for vision restoration" },
  { key: "appendectomy", label: "Appendectomy", icon: Scissors, description: "Removal of the appendix" },
  { key: "hip_replacement", label: "Hip Replacement", icon: Bone, description: "Total hip arthroplasty procedure" },
  { key: "hernia_repair", label: "Hernia Repair", icon: Stethoscope, description: "Surgical hernia correction" },
  { key: "cardiac_bypass", label: "Cardiac Bypass", icon: Heart, description: "Coronary artery bypass grafting" },
  { key: "angioplasty", label: "Angioplasty", icon: Activity, description: "Balloon catheter artery widening" },
];

const levelColor: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500";
  return <span className={`text-sm font-semibold ${cls}`}>{pct}%</span>;
}

function PlanCard({ plan }: { plan: SurgeryPlanResponse }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 capitalize">
          {plan.surgeryType.replace(/_/g, " ")}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span>Confidence:</span>
          <ConfidenceBadge value={plan.confidence} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Cost */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <DollarSign className="h-3.5 w-3.5" />
            Estimated Cost
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(plan.estimatedCostRange.min)} – {formatCurrency(plan.estimatedCostRange.max)}
          </p>
          <p className="text-xs text-muted">Avg: {formatCurrency(plan.estimatedCostRange.avg)}</p>
        </div>

        {/* Beds */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <BedDouble className="h-3.5 w-3.5" />
            Bed Availability
          </div>
          <p className="text-sm font-semibold text-slate-900">{plan.bedAvailability.available} beds free</p>
          <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${levelColor[plan.bedAvailability.level]}`}>
            {plan.bedAvailability.level} occupancy
          </span>
        </div>

        {/* Wait */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Clock className="h-3.5 w-3.5" />
            Wait Time
          </div>
          <p className="text-sm font-semibold text-slate-900">{plan.waitingDays} days</p>
          <p className="text-xs text-muted">Estimated queue</p>
        </div>

        {/* Duration */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Scissors className="h-3.5 w-3.5" />
            Surgery Duration
          </div>
          <p className="text-sm font-semibold text-slate-900">{plan.surgeryDuration}</p>
        </div>

        {/* Recovery */}
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Heart className="h-3.5 w-3.5" />
            Recovery
          </div>
          <p className="text-sm font-semibold text-slate-900">{plan.recoveryDays} days</p>
        </div>
      </div>
    </div>
  );
}

export function SurgeryPlannerPage() {
  const [getSurgeryPlan, { isLoading }] = useGetSurgeryPlanMutation();
  const [plans, setPlans] = useState<Record<string, SurgeryPlanResponse>>({});
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [patientAge, setPatientAge] = useState(40);

  const handlePlanSurgery = async (surgeryKey: string) => {
    setActivePlan(surgeryKey);
    try {
      const result = await getSurgeryPlan({
        surgeryType: surgeryKey,
        patientAge,
        conditions: [],
      }).unwrap();
      setPlans((prev) => ({ ...prev, [surgeryKey]: result.data }));
    } catch {
      // Toast handled by API layer
    } finally {
      setActivePlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="AI Surgery Planner"
          description="Get AI-powered estimates for surgery costs, bed availability, wait times, and recovery timelines."
        />

        <div className="flex items-center gap-3 pb-4">
          <label className="text-sm font-medium text-slate-700" htmlFor="patient-age">
            Patient Age:
          </label>
          <input
            id="patient-age"
            type="number"
            min={1}
            max={120}
            value={patientAge}
            onChange={(e) => setPatientAge(Number(e.target.value) || 40)}
            className="h-9 w-20 rounded-lg border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Estimates are AI-generated from hospital datasets. Always consult your doctor for actual costs and timelines.</span>
        </div>
      </Card>

      {/* Surgery selection grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SURGERIES.map((surgery) => {
          const Icon = surgery.icon;
          const plan = plans[surgery.key];

          return (
            <div key={surgery.key} className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{surgery.label}</h3>
                  <p className="text-xs text-muted mt-0.5">{surgery.description}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  loading={isLoading && activePlan === surgery.key}
                  onClick={() => void handlePlanSurgery(surgery.key)}
                  className="mt-auto w-full"
                >
                  {plan ? "Refresh Plan" : "Plan Surgery"}
                </Button>
              </div>

              {plan && <PlanCard plan={plan} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
