"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CalendarCheck, XCircle, Clock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { TableActions } from "@/components/ui/TableActions";
import { TableColumn } from "@/types";
import type { AppointmentDto } from "@/types/api";
import {
  useCompleteAppointmentMutation,
  useGetDoctorAppointmentsQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";
import { TableFilterConfig } from "@/hooks/useTable";

import { DoctorChartsPanel } from "./DoctorChartsPanel";


export function DoctorDashboardPage() {
  const router = useRouter();
  const { data: appts, isLoading: apptsLoading } = useGetDoctorAppointmentsQuery();
  const [complete] = useCompleteAppointmentMutation();
  const [activeCompleteId, setActiveCompleteId] = useState<string | null>(null);

  const appointments = appts?.appointments ?? [];

  const statusFilters: Array<TableFilterConfig<AppointmentDto>> = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        options: [
          { label: "All", value: "all" },
          { label: "Booked", value: "booked" },
          { label: "Completed", value: "completed" },
          { label: "No Show", value: "no_show" },
          { label: "Cancelled", value: "cancelled" },
        ],
        predicate: (row, value) => row.status === value,
      },
    ],
    []
  );

  const searchAppointments = (row: AppointmentDto, query: string) => {
    if (!query) {
      return true;
    }

    const dateLabel = new Date(row.date).toLocaleDateString().toLowerCase();
    const patientName = (row.patient?.name ?? row.patientId).toLowerCase();
    const status = row.status.replace("_", " ").toLowerCase();
    const appointmentId = row.id.toLowerCase();

    return [dateLabel, patientName, status, appointmentId].some((field) => field.includes(query));
  };

  const completeVisit = async (appointmentId: string) => {
    setActiveCompleteId(appointmentId);
    try {
      await complete(appointmentId).unwrap();
    } catch {
      /* toast via API layer */
    } finally {
      setActiveCompleteId(null);
    }
  };

  const columns: Array<TableColumn<AppointmentDto>> = [
    {
      key: "id",
      header: "Appointment ID",
      render: (row) => <span className="font-medium text-slate-800">#{row.id.slice(0, 8)}</span>,
    },
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patient?.name ?? row.patientId,
    },
    { key: "date", header: "Date", render: (row) => new Date(row.date).toLocaleDateString() },
    {
      key: "time",
      header: "Time",
      render: (row) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            row.status === "booked" && "bg-amber-50 text-amber-800",
            row.status === "completed" && "bg-emerald-50 text-emerald-800",
            row.status === "cancelled" && "bg-slate-100 text-slate-600"
          )}
        >
          {row.status.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (row) => (row.remarks?.trim() ? row.remarks : <span className="text-muted">-</span>),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <TableActions
          actions={[
            {
              id: `open-${row.id}`,
              label: "Open board",
              variant: "outline",
              onClick: () => router.push("/doctor/appointments"),
            },
            {
              id: `complete-${row.id}`,
              label: "Complete",
              variant: "primary",
              onClick: () => void completeVisit(row.id),
              loading: activeCompleteId === row.id,
              disabled: row.status !== "booked",
            },
          ]}
        />
      ),
    },
  ];

  const bookedCount = appointments.filter((a) => a.status === "booked").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <div className="space-y-8">
      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat icon={<CalendarCheck className="h-5 w-5 text-amber-500" />} label="Booked" value={bookedCount} bg="bg-amber-50" />
        <MiniStat icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} label="Completed" value={completedCount} bg="bg-emerald-50" />
        <MiniStat icon={<XCircle className="h-5 w-5 text-slate-400" />} label="Cancelled" value={cancelledCount} bg="bg-slate-50" />
        <MiniStat icon={<Clock className="h-5 w-5 text-blue-500" />} label="Total" value={appointments.length} bg="bg-blue-50" />
      </div>

      {/* ── Charts ── */}
      <DoctorChartsPanel />

      <Card>
        <CardHeader
          title="Appointment Monitoring"
          description="Manage and monitor all your patient appointments with reusable table controls."
        />
        <DataTable
          columns={columns}
          data={appointments}
          keyExtractor={(row) => row.id}
          loading={apptsLoading}
          emptyState="No appointments available right now."
          searchPredicate={searchAppointments}
          searchPlaceholder="Search by appointment ID, patient, date, or status"
          filters={statusFilters}
          pageSize={5}
        />
      </Card>
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
