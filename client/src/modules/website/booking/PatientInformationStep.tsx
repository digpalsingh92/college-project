"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  BadgePlus,
  Bell,
  CircleHelp,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/helpers/cn";

type StepItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  completed?: boolean;
};

const steps: StepItem[] = [
  { label: "Select Doctor", icon: UserRound, completed: true },
  { label: "Date & Time", icon: ClipboardList, completed: true },
  { label: "Patient Details", icon: UsersRound, active: true },
  { label: "Payment Method", icon: Phone },
  { label: "Confirm Appointment", icon: Stethoscope },
];

function StepIcon({ icon: Icon, active, completed }: { icon: ComponentType<{ className?: string }>; active?: boolean; completed?: boolean }) {
  return <Icon className={cn("h-4 w-4", active || completed ? "text-white" : "text-slate-500")} aria-hidden />;
}

function SectionHeader({ icon: Icon, title }: { icon: ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
      <Icon className="h-4 w-4 text-emerald-700" />
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

function TextField({ label, placeholder, type = "text", className }: { label: string; placeholder: string; type?: string; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectField({ label }: { label: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100">
        <option value="">Select</option>
        <option value="female">Female</option>
        <option value="male">Male</option>
        <option value="non-binary">Non-binary</option>
        <option value="other">Prefer not to say</option>
      </select>
    </label>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-70 shrink-0 flex-col border-r border-slate-200 bg-slate-50 px-6 py-6 md:fixed md:left-0 md:top-0 md:flex md:h-full">
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-700">Mediso</h1>
        <p className="mt-1 text-sm text-slate-500">Appointment Booking</p>
      </div>

      <nav className="flex flex-col gap-2 text-sm font-medium">
        {steps.map((step) => (
          <div
            key={step.label}
            className={cn(
              "flex items-center gap-3 rounded-full px-4 py-3 transition-colors",
              step.active ? "bg-emerald-700 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <StepIcon icon={step.icon} active={step.active} completed={step.completed} />
            <span>{step.label}</span>
            {step.completed ? <span className="ml-auto text-emerald-700">✓</span> : null}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-200 px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-emerald-700">
            <BadgePlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Dr. Sarah Jenkins</p>
            <p className="text-xs text-slate-500">Cardiology</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function PatientInformationStep() {
  const [reason, setReason] = useState("");
  const reasonCount = useMemo(() => reason.length, [reason]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900 md:flex">
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="text-2xl font-bold tracking-tight text-emerald-700">Mediso</div>
        <div className="flex gap-4 text-emerald-700">
          <Bell className="h-5 w-5" />
          <CircleHelp className="h-5 w-5" />
        </div>
      </nav>

      <Sidebar />

      <main className="flex-1 bg-[#f7f9fb] pt-16 md:ml-70 md:pt-0">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.5rem]">Patient Information</h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">Provide patient information for the appointment.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
            <form className="flex flex-col gap-8">
              <div className="space-y-5">
                <SectionHeader icon={BadgePlus} title="Personal Details" />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Full Name *" placeholder="Jane Doe" />
                  <TextField label="Email Address *" placeholder="jane.doe@example.com" type="email" />
                  <TextField label="Phone Number *" placeholder="(555) 123-4567" type="tel" />

                  <div className="grid grid-cols-2 gap-4">
                    <TextField label="Age *" placeholder="32" type="number" />
                    <SelectField label="Gender *" />
                  </div>

                  <label className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-xs font-medium text-slate-600">Residential Address</span>
                    <textarea
                      placeholder="123 Medical Way, Apt 4B, Healthville, ST 12345"
                      rows={2}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-5">
                <SectionHeader icon={Mail} title="Visit Details" />

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">Reason for Visit *</span>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value.slice(0, 500))}
                    placeholder="Briefly describe your symptoms or reason for the appointment..."
                    rows={5}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  <span className={cn("text-right text-xs", reasonCount > 480 ? "text-rose-600" : "text-slate-500")}>
                    {reasonCount} / 500
                  </span>
                </label>
              </div>

              <div className="space-y-5">
                <SectionHeader icon={Phone} title="Emergency Contact" />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField label="Contact Name" placeholder="John Doe" className="md:col-span-1" />
                    <TextField label="Contact Phone" placeholder="(555) 987-6543" type="tel" className="md:col-span-1" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/booking/date-time" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  Back
                </Link>

                <Link
                  href="#"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
                >
                  Continue to Payment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}