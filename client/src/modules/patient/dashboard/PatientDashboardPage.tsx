"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarCheck, Stethoscope, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { TableColumn } from "@/types";
import type { AppointmentDto } from "@/types/api";
import {
  useCancelAppointmentMutation,
  useGetPatientAppointmentsQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";
import { useAuth } from "@/hooks/useAuth";

export function PatientDashboardPage() {
  const { user } = useAuth();
  const { data: appts, isLoading: apptsLoading } = useGetPatientAppointmentsQuery({});
  const [cancelAppointment, { isLoading: cancelling }] = useCancelAppointmentMutation();

  const upcomingAppointment = useMemo(() => {
    const now = Date.now();
    const bookedAppointments = (appts?.appointments ?? []).filter(
      (appointment: AppointmentDto) => appointment.status === "booked"
    );

    return bookedAppointments
      .map((appointment: AppointmentDto) => {
        const appointmentDate = new Date(appointment.date);
        const [timePart, period] = appointment.startTime.split(" ");
        const [hoursStr, minutesStr] = timePart.split(":");
        const rawHours = Number(hoursStr);
        const minutes = Number(minutesStr);
        const hours24 = (rawHours % 12) + (period === "PM" ? 12 : 0);

        appointmentDate.setUTCHours(hours24, minutes, 0, 0);

        return {
          appointment,
          timestamp: appointmentDate.getTime(),
        };
      })
      .filter((item: { appointment: AppointmentDto; timestamp: number }) => item.timestamp >= now)
      .sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp)[0]?.appointment;
  }, [appts]);

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
            row.status === "booked" && "bg-emerald-50 text-emerald-800",
            row.status === "cancelled" && "bg-slate-100 text-slate-600",
            row.status === "completed" && "bg-blue-50 text-blue-700"
          )}
        >
          {row.status.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "remarks",
      header: "Notes",
      render: (row) => row.remarks?.trim() ? row.remarks : <span className="text-muted">—</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        row.status === "booked" || row.status === "no_show" ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="dangerSoft"
              loading={cancelling}
              type="button"
              onClick={async () => {
                try {
                  await cancelAppointment(row.id).unwrap();
                } catch {
                  /* handled by API layer error toaster */
                }
              }}
            >
              Cancel
            </Button>
            <Link
              href="/patient/booking-appointment"
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              Reschedule
            </Link>
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  const booked = appts?.appointments?.filter((a: AppointmentDto) => a.status === "booked").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header Dashboard Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Appointments Dashboard</h2>
          <p className="mt-1 text-sm text-muted">Track your booking history, active appointments, and schedule consults.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/patient/surgery-planner"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
          >
            AI Answers
          </Link>
          <Link
            href="/patient/surgery-planner"
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Estimations
          </Link>
          <Card className="flex items-center gap-3 border-emerald-100 bg-emerald-50/50 px-4 py-3 shadow-none" padding="none">
            <CalendarCheck className="h-8 w-8 text-emerald-600" strokeWidth={1.75} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">Active</p>
              <p className="text-lg font-semibold text-emerald-900">{booked} booked</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 border-slate-200 bg-white px-4 py-3 shadow-none" padding="none">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Next Visit</p>
              <p className="text-sm font-semibold text-slate-900">
                {upcomingAppointment
                  ? `${new Date(upcomingAppointment.date).toLocaleDateString()} ${upcomingAppointment.startTime}`
                  : "None scheduled"}
              </p>
              <p className="text-xs text-slate-600">
                Expected wait: {upcomingAppointment?.estimatedWaitTime ?? 0} mins
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Premium Booking CTA Card */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-850 to-emerald-950 p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
            <Stethoscope className="h-3.5 w-3.5" /> Direct Doctor Consultation
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Need to consult with a specialist?</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Select your preferred healthcare specialist, view waiting-time optimized slots, fill patient symptoms, and confirm with safe payment integrations (Card, UPI, or Health Insurance).
          </p>
        </div>
        <Link href="/patient/booking-appointment">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20">
            <PlusCircle className="h-5 w-5" />
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* History table card */}
      <Card>
        <CardHeader title="Your Appointment History" description="Manage and review status of all past and upcoming visits" />
        <Table
          columns={columns}
          data={appts?.appointments ?? []}
          keyExtractor={(row) => row.id}
          loading={apptsLoading}
          emptyState="No appointments scheduled yet. Click Book New Appointment above to get started!"
        />
      </Card>
    </div>
  );
}
