"use client";

import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  useGetDoctorAppointmentsQuery,
  useGetDoctorProfileQuery,
} from "@/store/apiSlice";
import type { AppointmentDto } from "@/types/api";
import dynamic from "next/dynamic";

const DoctorChartsPanel = dynamic(
  () => import("./DoctorChartsPanel").then((m) => m.DoctorChartsPanel),
  { ssr: false },
);

export function DoctorDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useGetDoctorProfileQuery();
  const { data: appts, isLoading: apptsLoading } = useGetDoctorAppointmentsQuery({});

  const d = profile?.doctor;
  const appointments = appts?.appointments ?? [];
  const bookedCount = appointments.filter((a: AppointmentDto) => a.status === "booked").length;
  const completedCount = appointments.filter((a: AppointmentDto) => a.status === "completed").length;
  const cancelledCount = appointments.filter((a: AppointmentDto) => a.status === "cancelled").length;

  return (
    <div className="space-y-8 pb-12">
      {/* ── Welcome Banner ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Welcome back, Dr. {d?.name || "Doctor"}
          </h1>
          <p className="text-sm text-slate-500">
            Specialization: <span className="font-semibold text-emerald-600 capitalize">{d?.doctorProfile?.specialization || "Clinical Staff"}</span> | Practice overview
          </p>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat
          icon={<CalendarCheck className="h-5 w-5 text-amber-500" />}
          label="Booked Visits"
          value={bookedCount}
          bg="bg-amber-50 border border-amber-100/60"
        />
        <MiniStat
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label="Completed Visits"
          value={completedCount}
          bg="bg-emerald-50 border border-emerald-100/60"
        />
        <MiniStat
          icon={<XCircle className="h-5 w-5 text-slate-400" />}
          label="Cancelled Visits"
          value={cancelledCount}
          bg="bg-slate-50 border border-slate-100"
        />
        <MiniStat
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          label="Total Visits Scheduled"
          value={appointments.length}
          bg="bg-blue-50 border border-blue-100/60"
        />
      </div>

      {/* ── Appointment Charts Panel ── */}
      <DoctorChartsPanel />
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl px-5 py-4 shadow-sm hover:shadow transition-shadow ${bg}`}>
      <div className="p-2.5 rounded-xl bg-white/90 shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

