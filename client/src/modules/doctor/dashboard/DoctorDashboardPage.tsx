"use client";

import {
  Mail,
  Stethoscope,
  CheckCircle2,
  CalendarCheck,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TableColumn } from "@/types";
import type { AppointmentDto } from "@/types/api";
import {
  useCompleteAppointmentMutation,
  useGetDoctorAppointmentsQuery,
  useGetDoctorProfileQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";
import dynamic from "next/dynamic";

const DoctorChartsPanel = dynamic(
  () => import("./DoctorChartsPanel").then((m) => m.DoctorChartsPanel),
  { ssr: false },
);

export function DoctorDashboardPage() {
  const { data: profile, isLoading: profileLoading } =
    useGetDoctorProfileQuery();
  const { data: appts, isLoading: apptsLoading } =
    useGetDoctorAppointmentsQuery({});
  const [complete, { isLoading: completing }] =
    useCompleteAppointmentMutation();

  const columns: Array<TableColumn<AppointmentDto>> = [
    {
      key: "date",
      header: "Date",
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    { key: "startTime", header: "Start" },
    { key: "endTime", header: "End" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            row.status === "booked" && "bg-amber-50 text-amber-800",
            row.status === "completed" && "bg-emerald-50 text-emerald-800",
            row.status === "cancelled" && "bg-slate-100 text-slate-600",
          )}
        >
          {row.status.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        row.status === "booked" ? (
          <Button
            size="sm"
            loading={completing}
            type="button"
            onClick={async () => {
              try {
                await complete(row.id).unwrap();
              } catch {
                /* toast via API layer */
              }
            }}
          >
            Complete visit
          </Button>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  const d = profile?.doctor;
  const appointments = appts?.appointments ?? [];
  const bookedCount = appointments.filter(
    (a: AppointmentDto) => a.status === "booked",
  ).length;
  const completedCount = appointments.filter(
    (a: AppointmentDto) => a.status === "completed",
  ).length;
  const cancelledCount = appointments.filter(
    (a: AppointmentDto) => a.status === "cancelled",
  ).length;

  return (
    <div className="space-y-8">
      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat
          icon={<CalendarCheck className="h-5 w-5 text-amber-500" />}
          label="Booked"
          value={bookedCount}
          bg="bg-amber-50"
        />
        <MiniStat
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label="Completed"
          value={completedCount}
          bg="bg-emerald-50"
        />
        <MiniStat
          icon={<XCircle className="h-5 w-5 text-slate-400" />}
          label="Cancelled"
          value={cancelledCount}
          bg="bg-slate-50"
        />
        <MiniStat
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          label="Total"
          value={appointments.length}
          bg="bg-blue-50"
        />
      </div>

      {/* ── Charts ── */}
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
    <div className={`flex items-center gap-3 rounded-xl px-4 py-4 ${bg}`}>
      {icon}
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
