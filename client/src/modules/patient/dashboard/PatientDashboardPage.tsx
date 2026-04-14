"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { ROUTES } from "@/constants/routes";
import { TableColumn } from "@/types";
import type { AppointmentDto, DoctorAvailabilitySlotDto, DoctorListItem } from "@/types/api";
import {
  useCancelAppointmentMutation,
  useCreateAppointmentMutation,
  useGetDoctorAvailabilityQuery,
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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rescheduleFromId, setRescheduleFromId] = useState<string | null>(null);

  const { data: availability, isFetching: loadingSlots } = useGetDoctorAvailabilityQuery(
    {
      doctorId,
      date,
    },
    {
      skip: !doctorId || !date,
    }
  );

  const slots: DoctorAvailabilitySlotDto[] = useMemo(() => {
    if (!availability) return [];
    if (availability.allSlots?.length) return availability.allSlots;
    return availability.slots.map((slot) => ({
      ...slot,
      isAvailable: true,
      status: "available",
    }));
  }, [availability]);

  useEffect(() => {
    setStartTime("");
    setEndTime("");
  }, [doctorId, date]);

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
      header: "Doctor Remarks",
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
                  if (rescheduleFromId === row.id) {
                    setRescheduleFromId(null);
                  }
                } catch {
                  /* toast via API layer */
                }
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => {
                setRescheduleFromId(row.id);
                setDoctorId(row.doctorId);
                setDate("");
                setStartTime("");
                setEndTime("");
              }}
            >
              Reschedule
            </Button>
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  async function handleBook(event: React.FormEvent) {
    event.preventDefault();
    if (!startTime || !endTime) return;

    try {
      if (rescheduleFromId) {
        await cancelAppointment(rescheduleFromId).unwrap();
      }

      await createAppointment({
        doctorId,
        date,
        startTime,
        endTime,
      }).unwrap();

      setRescheduleFromId(null);
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
          <Link
            href={ROUTES.booking}
            className="inline-flex h-12 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
          >
            Smart booking
          </Link>
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
          <CardHeader
            title={rescheduleFromId ? "Reschedule appointment" : "Book a visit"}
            description={
              rescheduleFromId
                ? "Reschedule flow: your old appointment is cancelled first, then a new slot is booked."
                : "Pick a date, then choose one of the doctor’s available time slots."
            }
          />
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
              {startTime && endTime ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Selected slot: <span className="font-semibold">{startTime} - {endTime}</span>
                </div>
              ) : null}
              <div className="sm:col-span-2 space-y-2">
                <p className="text-sm font-medium text-slate-800">Time slots</p>
                {!doctorId || !date ? (
                  <p className="text-sm text-muted">Choose doctor and date to load slots.</p>
                ) : loadingSlots ? (
                  <p className="text-sm text-muted">Loading slots…</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted">No available slots for this date.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {slots.map((slot) => {
                      const selected = slot.startTime === startTime && slot.endTime === endTime;
                      return (
                        <button
                          key={`${slot.startTime}-${slot.endTime}`}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => {
                            if (!slot.isAvailable) return;
                            setStartTime(slot.startTime);
                            setEndTime(slot.endTime);
                          }}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                            slot.isAvailable
                              ? "border-emerald-300 bg-white text-slate-800 hover:bg-emerald-50"
                              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through",
                            selected && "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-200"
                          )}
                        >
                          <div className="font-medium">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="mt-0.5 text-xs uppercase tracking-wide">
                            {slot.isAvailable ? "Available" : slot.status === "booked" ? "Booked" : "Unavailable"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <Button
              type="submit"
              loading={creating || (Boolean(rescheduleFromId) && cancelling)}
              disabled={creating || cancelling || !doctorId || !date || !startTime || !endTime}
            >
              {rescheduleFromId ? "Confirm reschedule" : "Schedule appointment"}
            </Button>
            {rescheduleFromId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setRescheduleFromId(null)}
              >
                Cancel reschedule mode
              </Button>
            ) : null}
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
