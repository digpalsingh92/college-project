"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { SlotCard } from "@/components/SlotCard";
import { TableColumn } from "@/types";
import type { AppointmentDto, AppointmentSlotsResponse, DoctorListItem } from "@/types/api";
import {
  useCancelAppointmentMutation,
  useCreateAppointmentMutation,
  useGetDoctorsQuery,
  useGetAppointmentSlotsQuery,
  useGetPatientAppointmentsQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";
import { useAuth } from "@/hooks/useAuth";

export function PatientDashboardPage() {
  const { user } = useAuth();
  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery();
  const { data: appts, isLoading: apptsLoading } = useGetPatientAppointmentsQuery({});
  const [createAppointment, { isLoading: creating }] = useCreateAppointmentMutation();
  const [cancelAppointment, { isLoading: cancelling }] = useCancelAppointmentMutation();

  const [showAppointmentFlow, setShowAppointmentFlow] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [patientName, setPatientName] = useState(user?.name ?? "");
  const [patientEmail, setPatientEmail] = useState(user?.email ?? "");
  const [issue, setIssue] = useState("");
  const [rescheduleFromId, setRescheduleFromId] = useState<string | null>(null);
  const slotRailRef = useRef<HTMLDivElement | null>(null);

  const { data: slotPredictions, isFetching: loadingSlots } = useGetAppointmentSlotsQuery(
    {
      doctorId,
      date,
    },
    {
      skip: !doctorId || !date,
    }
  );

  const slots = (slotPredictions?.slots ?? []) as AppointmentSlotsResponse["slots"];

  const selectedDoctor = (doctorsData?.doctors ?? []).find((d: DoctorListItem) => d.id === doctorId) ?? null;

  const isStep1Complete = Boolean(doctorId);
  const isStep2Complete = Boolean(date && startTime && endTime);
  const isStep3Complete = Boolean(patientName.trim() && patientEmail.trim() && issue.trim());
  const canSubmit = isStep1Complete && isStep2Complete && isStep3Complete;

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
                setShowAppointmentFlow(true);
                setStep(1);
                setRescheduleFromId(row.id);
                setDoctorId(row.doctorId);
                setDate("");
                setStartTime("");
                setEndTime("");
                setIssue("");
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
    if (!canSubmit) return;

    try {
      if (rescheduleFromId) {
        await cancelAppointment(rescheduleFromId).unwrap();
      }

      await createAppointment({
        doctorId,
        date,
        startTime,
        endTime,
        remarks: issue.trim(),
      }).unwrap();

      setShowAppointmentFlow(false);
      setStep(1);
      setDoctorId("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setIssue("");
      setRescheduleFromId(null);
    } catch {
      /* toast via API layer */
    }
  }

  function nextStep() {
    if (step === 1 && !isStep1Complete) return;
    if (step === 2 && !isStep2Complete) return;
    if (step === 3 && !isStep3Complete) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
  }

  function previousStep() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  }

  function scrollSlots(direction: "left" | "right") {
    if (!slotRailRef.current) return;
    const amount = direction === "left" ? -320 : 320;
    slotRailRef.current.scrollBy({ left: amount, behavior: "smooth" });
  }

  const booked = appts?.appointments?.filter((a: AppointmentDto) => a.status === "booked").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Appointments</h2>
          <p className="mt-1 text-sm text-muted">Book a visit, then jump to AI answers or estimations when needed.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/patient/surgery-planner"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
          >
            AI answers
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
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">Upcoming</p>
              <p className="text-lg font-semibold text-emerald-900">{booked} active</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 border-slate-200 bg-white px-4 py-3 shadow-none" padding="none">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Next visit</p>
              <p className="text-sm font-semibold text-slate-900">
                {upcomingAppointment
                  ? `${new Date(upcomingAppointment.date).toLocaleDateString()} ${upcomingAppointment.startTime}`
                  : "No upcoming visit"}
              </p>
              <p className="text-xs text-slate-600">
                Expected wait: {upcomingAppointment?.estimatedWaitTime ?? 0} mins
              </p>
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
                  onClick={() => {
                    setDoctorId(d.id);
                    setDate("");
                    setStartTime("");
                    setEndTime("");
                    setShowAppointmentFlow(true);
                    setStep(1);
                  }}
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
            title={rescheduleFromId ? "Reschedule appointment" : "Add appointment"}
            description={
              rescheduleFromId
                ? "Use this multi-step flow to pick a new slot."
                : "Start a guided multi-step form to schedule your next visit."
            }
          />
          {!showAppointmentFlow ? (
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => {
                  setShowAppointmentFlow(true);
                  setStep(1);
                  if (!rescheduleFromId) {
                    setDoctorId("");
                    setDate("");
                    setStartTime("");
                    setEndTime("");
                    setIssue("");
                  }
                }}
              >
                Add appointment
              </Button>
              <p className="text-sm text-muted">
                You will complete 4 steps: doctor, date and time, patient details with issue, then confirmation.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleBook}>
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { id: 1, label: "Doctor" },
                    { id: 2, label: "Date & Time" },
                    { id: 3, label: "Patient Details" },
                    { id: 4, label: "Confirmation" },
                  ].map((item) => {
                    const active = step === item.id;
                    const done = step > item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.id < step) {
                            setStep(item.id as 1 | 2 | 3 | 4);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                          done
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : active
                              ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm"
                              : "border-slate-200 bg-white text-slate-500",
                          item.id < step ? "cursor-pointer hover:border-emerald-400" : "cursor-default"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                            done
                              ? "bg-emerald-600 text-white"
                              : active
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : item.id}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Step {step} of 4</p>
              </div>

              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="doctor-select">
                      Select doctor
                    </label>
                    <select
                      id="doctor-select"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={doctorId}
                      onChange={(e) => {
                        setDoctorId(e.target.value);
                        setDate("");
                        setStartTime("");
                        setEndTime("");
                      }}
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
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <Input
                    type="date"
                    label="Select date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setStartTime("");
                      setEndTime("");
                    }}
                    required
                  />
                  {startTime && endTime ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Selected slot: <span className="font-semibold">{startTime} - {endTime}</span>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">Time slots</p>
                      <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => scrollSlots("left")}> 
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => scrollSlots("right")}> 
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {!doctorId || !date ? (
                      <p className="text-sm text-muted">Choose doctor and date to load slots.</p>
                    ) : loadingSlots ? (
                      <p className="text-sm text-muted">Loading slots…</p>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-muted">No available slots for this date.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {slotPredictions?.recommendedSlot ? (
                            <span className="inline-flex rounded-full bg-emerald-600 px-2 py-1 text-xs font-medium text-white">
                              Recommended: {slotPredictions.recommendedSlot}
                            </span>
                          ) : null}
                          {slotPredictions?.avoidSlot ? (
                            <span className="inline-flex rounded-full bg-red-600 px-2 py-1 text-xs font-medium text-white">
                              Avoid: {slotPredictions.avoidSlot}
                            </span>
                          ) : null}
                        </div>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-white to-transparent" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-white to-transparent" />
                          <div
                            ref={slotRailRef}
                            className="hide-scrollbar flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          >
                          {slots.map((slot) => {
                            const selected = slot.startTime === startTime && slot.endTime === endTime;
                            return (
                              <div key={`${slot.startTime}-${slot.endTime}`} className="w-60 min-w-60 shrink-0">
                                <SlotCard
                                  time={slot.time}
                                  waitTime={slot.estimatedWaitTime}
                                  waitLevel={slot.waitLevel}
                                  isRecommended={slotPredictions?.recommendedSlot === slot.time}
                                  isAvoid={slotPredictions?.avoidSlot === slot.time}
                                  selected={selected}
                                  onSelect={() => {
                                    setStartTime(slot.startTime);
                                    setEndTime(slot.endTime);
                                  }}
                                />
                              </div>
                            );
                          })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <Input
                    label="Patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    label="Patient email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    required
                  />
                  <div className="flex w-full flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="patient-issue">
                      Issue patient is facing
                    </label>
                    <textarea
                      id="patient-issue"
                      className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      placeholder="Briefly describe symptoms or reason for visit"
                      required
                    />
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Confirm appointment details</p>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">Doctor:</span>{" "}
                      {selectedDoctor?.name ?? "Not selected"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Specialization:</span>{" "}
                      {selectedDoctor?.doctorProfile?.specialization ?? "General"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Date:</span> {date || "Not selected"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Time:</span>{" "}
                      {startTime && endTime ? `${startTime} - ${endTime}` : "Not selected"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Patient:</span> {patientName || "Not provided"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Email:</span> {patientEmail || "Not provided"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Issue:</span> {issue || "Not provided"}
                    </p>
                    {rescheduleFromId ? (
                      <p className="pt-1 text-xs text-amber-700">
                        Reschedule mode is active: the previous booked appointment will be cancelled before this new
                        appointment is created.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={previousStep}>
                    Previous
                  </Button>
                ) : null}

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (step === 1 && !isStep1Complete) ||
                      (step === 2 && !isStep2Complete) ||
                      (step === 3 && !isStep3Complete)
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    loading={creating || (Boolean(rescheduleFromId) && cancelling)}
                    disabled={creating || cancelling || !canSubmit}
                  >
                    {rescheduleFromId ? "Confirm reschedule" : "Submit appointment"}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAppointmentFlow(false);
                    setStep(1);
                    setRescheduleFromId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
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
