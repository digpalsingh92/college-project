"use client";

import { Mail, Stethoscope, CheckCircle2, CalendarCheck, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { TableColumn } from "@/types";
import type { AppointmentDto } from "@/types/api";
import {
  useCompleteAppointmentMutation,
  useGetDoctorAppointmentsQuery,
  useGetDoctorProfileQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";

import { DoctorChartsPanel } from "./DoctorChartsPanel";


export function DoctorDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useGetDoctorProfileQuery();
  const { data: appts, isLoading: apptsLoading } = useGetDoctorAppointmentsQuery();
  const [complete, { isLoading: completing }] = useCompleteAppointmentMutation();

  const columns: Array<TableColumn<AppointmentDto>> = [
    { key: "date", header: "Date", render: (row) => new Date(row.date).toLocaleDateString() },
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
            row.status === "cancelled" && "bg-slate-100 text-slate-600"
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

      {/* ── Profile + appointments grid ──
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Profile" description="How patients see you" />
          {profileLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : d ? (
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl font-semibold text-white shadow-md">
                {d.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{d.name}</p>
                  <p className="text-sm text-emerald-700">{d.doctorProfile?.specialization ?? "Physician"}</p>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted">
                  <span className="inline-flex items-center justify-center gap-2 sm:justify-start">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {d.email}
                  </span>
                  <span className="inline-flex items-center justify-center gap-2 sm:justify-start">
                    <Stethoscope className="h-4 w-4 text-slate-400" />
                    {d.doctorProfile?.experience ?? "—"} yrs experience
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" type="button">
                    Edit profile
                  </Button>
                  <Button size="sm" type="button">
                    Message (soon)
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No profile data.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Today’s schedule"
            description="Mark visits complete when finished"
            action={
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {(appts?.appointments ?? []).filter((a) => a.status === "booked").length} booked
              </span>
            }
          />
          <Table
            columns={columns}
            data={appts?.appointments ?? []}
            keyExtractor={(row) => row.id}
            loading={apptsLoading}
            emptyState="No appointments yet."
          />
        </Card>
      </div> */}
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
