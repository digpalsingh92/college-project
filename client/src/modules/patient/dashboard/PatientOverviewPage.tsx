"use client";

import Link from "next/link";
import { CalendarCheck, MessageSquareHeart, Scissors } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useGetPatientAppointmentsQuery } from "@/store/apiSlice";
import type { AppointmentDto } from "@/types/api";

function getNextAppointment(appointments: AppointmentDto[]) {
  const now = Date.now();

  return appointments
    .filter((appointment) => appointment.status === "booked")
    .map((appointment) => {
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
    .filter((item) => item.timestamp >= now)
    .sort((a, b) => a.timestamp - b.timestamp)[0]?.appointment;
}

export function PatientOverviewPage() {
  const { user } = useAuth();
  const { data: appts, isLoading } = useGetPatientAppointmentsQuery({});

  const appointments = appts?.appointments ?? [];
  const bookedCount = appointments.filter((appointment) => appointment.status === "booked").length;
  const nextAppointment = getNextAppointment(appointments);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Review your upcoming visit, then jump into appointments, AI answers, or estimations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/patient/appointments"
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Add appointment
          </Link>
          <Link
            href="/patient/surgery-planner"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
          >
            AI answers
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-emerald-100 bg-emerald-50/50 shadow-none" padding="md">
          <CardHeader title="Appointments" description="Quick access to booking" />
          <p className="text-3xl font-semibold text-emerald-900">{bookedCount}</p>
          <p className="mt-1 text-sm text-emerald-800/80">Active booked appointments</p>
        </Card>

        <Card className="shadow-none" padding="md">
          <CardHeader title="Next visit" description="Your soonest confirmed appointment" />
          <p className="text-sm font-semibold text-slate-900">
            {isLoading
              ? "Loading…"
              : nextAppointment
                ? `${new Date(nextAppointment.date).toLocaleDateString()} ${nextAppointment.startTime}`
                : "No upcoming visit"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Estimated wait: {nextAppointment?.estimatedWaitTime ?? 0} mins
          </p>
        </Card>

        <Card className="shadow-none" padding="md">
          <CardHeader title="Estimations" description="Jump to the planning assistant" />
          <div className="flex flex-col gap-2">
            <Link
              href="/patient/surgery-planner"
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Open estimations
            </Link>
            <p className="text-xs text-slate-600">Get AI guidance for wait time, pricing, and bed availability.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Quick actions"
          description="Use the dashboard to move directly into booking or AI help"
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/patient/appointments"
                className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Add appointment
              </Link>
              <Link
                href="/patient/surgery-planner"
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
              >
                AI answers
              </Link>
              <Link
                href="/patient/surgery-planner"
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
              >
                Estimations
              </Link>
            </div>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <CalendarCheck className="h-6 w-6 text-emerald-700" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-semibold text-slate-900">Book an appointment</p>
            <p className="mt-1 text-sm text-muted">Open the booking flow and choose a doctor, date, and slot.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <MessageSquareHeart className="h-6 w-6 text-slate-900" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-semibold text-slate-900">Ask the AI assistant</p>
            <p className="mt-1 text-sm text-muted">Get answers about pricing, wait times, or bed availability.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Scissors className="h-6 w-6 text-slate-900" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-semibold text-slate-900">View estimations</p>
            <p className="mt-1 text-sm text-muted">Jump into the estimation view for the latest planning insights.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}