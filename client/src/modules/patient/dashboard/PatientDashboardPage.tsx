"use client";

import { useState } from "react";
import { CalendarCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { TableColumn } from "@/types";
import type { AppointmentDto, DoctorListItem } from "@/types/api";
import {
  useCancelAppointmentMutation,
  useCreateAppointmentMutation,
  useGetDoctorsQuery,
  useGetPatientAppointmentsQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";

export function PatientDashboardPage() {
  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery();
  const { data: appts, isLoading: apptsLoading } = useGetPatientAppointmentsQuery();
  const [createAppointment, { isLoading: creating }] = useCreateAppointmentMutation();
  const [cancelAppointment, { isLoading: cancelling }] = useCancelAppointmentMutation();

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");

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
      key: "actions",
      header: "Actions",
      render: (row) =>
        row.status === "booked" ? (
          <Button
            size="sm"
            variant="dangerSoft"
            loading={cancelling}
            type="button"
            onClick={async () => {
              try {
                await cancelAppointment(row.id).unwrap();
              } catch {
                /* toast via API layer */
              }
            }}
          >
            Cancel
          </Button>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  async function handleBook(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createAppointment({
        doctorId,
        date,
        startTime,
        endTime,
      }).unwrap();
    } catch {
      /* toast via API layer */
    }
  }

  const booked = appts?.appointments?.filter((a) => a.status === "booked").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Your visits, providers, and scheduling in one calm view.</p>
        </div>
        <div className="flex gap-3">
          <Card className="flex items-center gap-3 border-emerald-100 bg-emerald-50/50 px-4 py-3 shadow-none" padding="none">
            <CalendarCheck className="h-8 w-8 text-emerald-600" strokeWidth={1.75} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">Upcoming</p>
              <p className="text-lg font-semibold text-emerald-900">{booked} active</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Find providers" description="Browse doctors accepting appointments" />
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {doctorsLoading ? (
              <p className="text-sm text-muted">Loading doctors…</p>
            ) : (
              (doctorsData?.doctors ?? []).map((d: DoctorListItem) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDoctorId(d.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                    doctorId === d.id
                      ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Stethoscope className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{d.name}</p>
                    <p className="truncate text-sm text-muted">{d.doctorProfile?.specialization ?? "General"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Book a visit" description="Choose slot details — times use 24h format (e.g. 09:30)" />
          <form className="space-y-4" onSubmit={handleBook}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="doctor-select">
                  Doctor
                </label>
                <select
                  id="doctor-select"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  disabled={doctorsLoading}
                >
                  <option value="">Select a doctor</option>
                  {(doctorsData?.doctors ?? []).map((d: DoctorListItem) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.doctorProfile?.specialization ?? "Doctor"}
                    </option>
                  ))}
                </select>
              </div>
              <Input type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} required />
              <Input label="Start time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              <Input
                label="End time"
                className="sm:col-span-2"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
            <Button type="submit" loading={creating} disabled={creating || !doctorId}>
              Schedule appointment
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader title="Your appointments" description="Track status and manage upcoming visits" />
        <Table
          columns={columns}
          data={appts?.appointments ?? []}
          keyExtractor={(row) => row.id}
          loading={apptsLoading}
          emptyState="No appointments yet — book your first visit above."
        />
      </Card>
    </div>
  );
}
