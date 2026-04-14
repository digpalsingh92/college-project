"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/helpers/cn";
import {
  useCreateAppointmentMutation,
  useGetDoctorSlotRecommendationsQuery,
  useGetDoctorsQuery,
} from "@/store/apiSlice";
import type { DoctorListItem, SlotRecommendationDto } from "@/types/api";
import { SlotCard } from "@/components/SlotCard";

export function BookingPage() {
  const { isAuthenticated } = useAuth();
  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery();
  const [createAppointment, { isLoading: booking }] = useCreateAppointmentMutation();

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlotKey, setSelectedSlotKey] = useState("");

  const { data: recommendations, isFetching: recommendationsLoading } = useGetDoctorSlotRecommendationsQuery(
    { doctorId, date },
    { skip: !doctorId || !date }
  );

  const slots = recommendations?.slots ?? [];
  const recommendedSlot = slots.find((slot) => slot.label === "recommended") ?? slots[0] ?? null;
  const selectedSlot = slots.find((slot) => `${slot.time}-${slot.endTime}` === selectedSlotKey) ?? recommendedSlot;

  const selectedDoctor = useMemo(
    () => doctorsData?.doctors.find((doctor) => doctor.id === doctorId) ?? null,
    [doctorsData, doctorId]
  );

  const handleBook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!doctorId || !date || !selectedSlot) {
      return;
    }

    await createAppointment({
      doctorId,
      date,
      startTime: selectedSlot.time,
      endTime: selectedSlot.endTime,
    }).unwrap();

    toast.success(`Booked ${selectedSlot.time} successfully.`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Smart booking</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Pick the slot with the best flow</h1>
          <p className="max-w-2xl text-sm text-slate-600 md:text-base">
            Choose a doctor and date, then compare waiting time, no-show risk, and the recommended slot in a single view.
          </p>
          {!isAuthenticated ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You can preview recommendations now, but you need to sign in before booking.
              <span className="ml-2 inline-flex gap-3">
                <Link href={ROUTES.login} className="font-semibold underline decoration-amber-400 underline-offset-2">
                  Sign in
                </Link>
                <Link href={ROUTES.register} className="font-semibold underline decoration-amber-400 underline-offset-2">
                  Create account
                </Link>
              </span>
            </div>
          ) : null}
        </div>

        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60 shadow-md" padding="lg">
          <p className="text-sm font-medium text-emerald-800">Current context</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center gap-3 rounded-lg bg-white/80 px-3 py-2">
              <Stethoscope className="h-4 w-4 text-emerald-600" />
              <span>{selectedDoctor?.name ?? "No doctor selected"}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/80 px-3 py-2">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              <span>{date || "Pick a booking date"}</span>
            </div>
            <div className="rounded-lg bg-white/80 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
              {recommendations?.confidence ? `Confidence ${Math.round(recommendations.confidence * 100)}%` : "Waiting for recommendation data"}
            </div>
          </div>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="Choose doctor and date" description="Recommendations refresh as soon as both fields are set." />
          <form className="space-y-4" onSubmit={handleBook}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800" htmlFor="doctor-select">
                Doctor
              </label>
              <select
                id="doctor-select"
                className={cn(
                  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
                  doctorsLoading && "opacity-70"
                )}
                value={doctorId}
                onChange={(event) => {
                  setDoctorId(event.target.value);
                  setSelectedSlotKey("");
                }}
                required
                disabled={doctorsLoading}
              >
                <option value="">Select a doctor</option>
                {(doctorsData?.doctors ?? []).map((doctor: DoctorListItem) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} — {doctor.doctorProfile?.specialization ?? "Doctor"}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="date"
              label="Date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSelectedSlotKey("");
              }}
              required
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {selectedDoctor ? (
                <>
                  Selected provider: <span className="font-semibold text-slate-900">{selectedDoctor.name}</span>
                </>
              ) : (
                <>Pick a doctor to load the recommendation model.</>
              )}
            </div>

            <Button type="submit" className="w-full" loading={booking} disabled={booking || !selectedSlot || !isAuthenticated}>
              Book selected slot
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Recommended slots" description="Lowest wait and best score appear first in the data, but we preserve schedule order." />

          {!doctorId || !date ? (
            <p className="text-sm text-muted">Choose a doctor and date to see recommendations.</p>
          ) : recommendationsLoading ? (
            <p className="text-sm text-muted">Loading smart slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted">No available slots for this date.</p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot: SlotRecommendationDto) => (
                <SlotCard
                  key={`${slot.time}-${slot.endTime}`}
                  slot={slot}
                  selected={selectedSlot?.time === slot.time && selectedSlot?.endTime === slot.endTime}
                  onSelect={() => setSelectedSlotKey(`${slot.time}-${slot.endTime}`)}
                />
              ))}

              {selectedSlot ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Selected {selectedSlot.time} - {selectedSlot.endTime} with an estimated wait of {selectedSlot.estimatedWait} mins.
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
