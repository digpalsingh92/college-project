"use client";

import Link from "next/link";
import { useMemo, type ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDot,
  CircleOff,
  CircleUserRound,
  LayoutGrid,
  Smartphone,
  SunMedium,
  Video,
} from "lucide-react";
import { cn } from "@/helpers/cn";

type TimeSlot = {
  label: string;
  disabled?: boolean;
  selected?: boolean;
};

type AppointmentType = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  selected?: boolean;
};

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const calendarDays = [
  { day: 29, muted: true },
  { day: 30, muted: true },
  { day: 1 },
  { day: 2 },
  { day: 3 },
  { day: 4, hasAvailability: true },
  { day: 5, hasAvailability: true },
  { day: 6, hasAvailability: true },
  { day: 7, hasAvailability: true },
  { day: 8, hasAvailability: true },
  { day: 9, hasAvailability: true },
  { day: 10, hasAvailability: true },
  { day: 11, selected: true },
  { day: 12, hasAvailability: true },
  { day: 13, hasAvailability: true },
  { day: 14, hasAvailability: true },
  { day: 15, hasAvailability: true },
];

const morningSlots: TimeSlot[] = [
  { label: "09:00 AM" },
  { label: "09:30 AM" },
  { label: "10:00 AM" },
  { label: "10:30 AM", disabled: true },
  { label: "11:00 AM" },
  { label: "11:30 AM", selected: true },
];

const afternoonSlots: TimeSlot[] = [
  { label: "12:00 PM" },
  { label: "12:30 PM" },
  { label: "01:00 PM", disabled: true },
  { label: "01:30 PM", disabled: true },
  { label: "02:00 PM" },
  { label: "02:30 PM" },
  { label: "03:00 PM" },
  { label: "03:30 PM" },
  { label: "04:00 PM" },
  { label: "04:30 PM" },
];

const appointmentTypes: AppointmentType[] = [
  {
    id: "in-person",
    title: "In-person Consultation",
    description: "Visit the doctor at the clinic.",
    icon: CircleUserRound,
    selected: true,
  },
  {
    id: "video",
    title: "Video Consultation",
    description: "Online meeting via secure link.",
    icon: Video,
  },
];

function SidebarIcon({ icon: Icon, active = false }: { icon: ComponentType<{ className?: string }>; active?: boolean }) {
  return <Icon className={cn("h-4 w-4", active ? "text-emerald-700" : "text-slate-500")} aria-hidden />;
}

function SlotButton({ slot }: { slot: TimeSlot }) {
  return (
    <button
      type="button"
      disabled={slot.disabled}
      className={cn(
        "relative flex h-10 items-center justify-center rounded border px-3 text-sm transition-colors",
        slot.selected
          ? "border-emerald-700 bg-emerald-50 font-semibold text-emerald-700"
          : slot.disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 line-through"
            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
      )}
    >
      {slot.label}
      {slot.selected ? <span className="absolute right-0 top-0 h-0 w-0 border-r-12 border-t-12 border-r-emerald-700 border-t-transparent" /> : null}
      {slot.selected ? <Check className="absolute right-0.5 top-0.5 h-3 w-3 text-white" /> : null}
    </button>
  );
}

function AppointmentTypeCard({ type }: { type: AppointmentType }) {
  const Icon = type.icon;

  return (
    <label className="relative cursor-pointer">
      <input type="radio" name="appointment-type" className="peer sr-only" defaultChecked={type.selected} />
      <div
        className={cn(
          "flex items-start gap-4 rounded-xl border p-4 transition-colors",
          type.selected ? "border-emerald-700 bg-emerald-50/40" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20"
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            type.selected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 pr-10">
          <h4 className="text-base font-semibold text-slate-900">{type.title}</h4>
          <p className="mt-1 text-sm text-slate-600">{type.description}</p>
        </div>

        <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300 peer-checked:border-emerald-700">
          <div className={cn("h-2.5 w-2.5 rounded-full", type.selected ? "bg-emerald-700" : "bg-transparent")} />
        </div>
      </div>
    </label>
  );
}

function SlotGroup({ title, icon, slots }: { title: string; icon: ComponentType<{ className?: string }>; slots: TimeSlot[] }) {
  const Icon = icon;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-emerald-700" />
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((slot) => (
          <SlotButton key={slot.label} slot={slot} />
        ))}
      </div>
    </section>
  );
}

export function DateTimeStep() {
  const selectedSlot = useMemo(() => "Oct 11, 11:30 AM", []);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900 md:flex md:flex-row">
      <nav className="hidden w-70 shrink-0 flex-col gap-4 border-r border-slate-200 bg-slate-50 px-6 py-6 md:fixed md:left-0 md:top-0 md:flex md:h-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-700">Mediso</h1>
          <p className="mt-1 text-sm text-slate-500">Appointment Booking</p>
        </div>

        <ul className="flex flex-1 flex-col gap-2 pt-4">
          <li>
            <a href="/booking/select-doctor" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100">
              <SidebarIcon icon={CircleDot} />
              Select Doctor
              <span className="ml-auto text-emerald-700">
                <Check className="h-4 w-4" />
              </span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm">
              <SidebarIcon icon={CalendarDays} active />
              Date &amp; Time
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100">
              <SidebarIcon icon={LayoutGrid} />
              Patient Details
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100">
              <SidebarIcon icon={CircleAlert} />
              Payment Method
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100">
              <SidebarIcon icon={CircleOff} />
              Confirm Appointment
            </a>
          </li>
        </ul>

        <div className="mt-auto flex items-center gap-3 border-t border-slate-200 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500">
            <CircleUserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Guest User</p>
            <p className="text-xs text-slate-500">Sign in for faster booking</p>
          </div>
        </div>
      </nav>

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-700">Mediso</h1>
        <div className="flex gap-4 text-slate-500">
          <button type="button" className="rounded-full p-2 hover:bg-slate-100" aria-label="Notifications">
            <CircleDot className="h-5 w-5" />
          </button>
          <button type="button" className="rounded-full p-2 hover:bg-slate-100" aria-label="Help">
            <CircleAlert className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 md:ml-70 md:min-h-screen">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <div className="mb-2 flex items-center gap-2 text-emerald-700 md:hidden">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Select Doctor</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.5rem]">Choose Date &amp; Time</h2>
            <p className="mt-2 text-base text-slate-600 sm:text-lg">Select an available appointment slot for your consultation.</p>
          </section>

          <section className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">October 2024</h3>
                  <div className="flex gap-2">
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Previous month">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Next month">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
                  {weekdayLabels.map((day) => (
                    <span key={day} className="py-2">
                      {day}
                    </span>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm text-slate-700">
                  {calendarDays.map((day, index) => (
                    <button
                      key={`${day.day}-${index}`}
                      type="button"
                      disabled={day.muted}
                      className={cn(
                        "relative h-10 rounded-full transition-colors",
                        day.muted ? "cursor-default text-slate-300" : day.selected ? "bg-emerald-700 font-semibold text-white" : "hover:bg-slate-100"
                      )}
                    >
                      {day.day}
                      {day.hasAvailability ? <span className={cn("absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full", day.selected ? "bg-white" : "bg-emerald-700")} /> : null}
                    </button>
                  ))}

                  <div className="col-span-7 mt-2 border-t border-slate-200 pt-4 text-center text-xs text-slate-300">
                    Select a date with available slots marked with <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-700 align-middle" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-7">
              <SlotGroup title="Morning" icon={SunMedium} slots={morningSlots} />
              <SlotGroup title="Afternoon" icon={Smartphone} slots={afternoonSlots} />
            </div>
          </section>

          <section className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Appointment Type</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {appointmentTypes.map((type) => (
                <AppointmentTypeCard key={type.id} type={type} />
              ))}
            </div>
          </section>

          <section className="mt-8 flex flex-col gap-4 border-t border-slate-200 py-4 md:flex-row md:items-center md:justify-between">
            <Link
              href="/booking/select-doctor"
              className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4 md:justify-end">
              <div className="text-right">
                <p className="text-xs text-slate-500">Selected Slot</p>
                <p className="text-lg font-semibold text-emerald-700">{selectedSlot}</p>
              </div>

              <Link
                href="/booking/patient-details"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <footer className="mt-12 border-t border-slate-200 py-6" />
        </div>
      </main>
    </div>
  );
}