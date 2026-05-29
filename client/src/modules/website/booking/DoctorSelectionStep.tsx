"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  LayoutList,
  Menu,
  Search,
  ShieldPlus,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/helpers/cn";

type DoctorCategory = "All Specialists" | "Cardiologist" | "Dermatologist" | "Neurologist";

type DoctorCard = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: string;
  reviews: number;
  hospital: string;
  availability: string;
  availabilityTone: "today" | "tomorrow";
  selected?: boolean;
};

const sidebarItems = [
  { label: "Select Doctor", icon: UserRound, active: true },
  { label: "Date & Time", icon: CalendarDays },
  { label: "Patient Details", icon: LayoutList },
  { label: "Payment Method", icon: Wallet },
  { label: "Confirm Appointment", icon: ShieldPlus },
];

const filters: DoctorCategory[] = ["All Specialists", "Cardiologist", "Dermatologist", "Neurologist"];

const doctors: DoctorCard[] = [
  {
    id: "sarah-jenkins",
    name: "Dr. Sarah Jenkins",
    specialization: "Cardiologist",
    experience: "12 Years",
    rating: "4.9",
    reviews: 120,
    hospital: "Mediso General Hospital",
    availability: "Available Today",
    availabilityTone: "today",
    selected: true,
  },
  {
    id: "marcus-webb",
    name: "Dr. Marcus Webb",
    specialization: "Neurologist",
    experience: "8 Years",
    rating: "4.8",
    reviews: 85,
    hospital: "City Central Clinic",
    availability: "Available Tomorrow",
    availabilityTone: "tomorrow",
  },
  {
    id: "emily-chen",
    name: "Dr. Emily Chen",
    specialization: "Dermatologist",
    experience: "15 Years",
    rating: "4.9",
    reviews: 210,
    hospital: "Mediso Skin Center",
    availability: "Available Today",
    availabilityTone: "today",
  },
];

function SidebarIcon({ icon: Icon, active = false }: { icon: ComponentType<{ className?: string }>; active?: boolean }) {
  return <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-500")} aria-hidden />;
}

function DoctorAvatar({ name, active = false }: { name: string; active?: boolean }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(1, 3)
    .map((part) => part[0])
    .join("");

  return (
    <div
      className={cn(
        "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full",
        active ? "ring-2 ring-emerald-200" : "ring-1 ring-slate-200"
      )}
    >
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-white to-slate-100 text-sm font-semibold text-emerald-900">
        {initials}
      </div>
      <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
    </div>
  );
}

function DoctorCardView({ doctor }: { doctor: DoctorCard }) {
  const selected = Boolean(doctor.selected);

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-[0_4px_18px_rgba(15,23,42,0.06)] transition-all duration-300",
        selected ? "border-emerald-700 ring-1 ring-emerald-200" : "border-slate-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
      )}
    >
      {selected ? (
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm">
          <Check className="h-4 w-4" />
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <DoctorAvatar name={doctor.name} active={selected} />
        <div className="min-w-0">
          <h3 className={cn("truncate text-lg font-semibold tracking-tight text-slate-900", selected && "pr-8")}>{doctor.name}</h3>
          <p className="text-sm text-emerald-700">{doctor.specialization}</p>
        </div>
      </div>

      <div className="my-5 border-y border-slate-200 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              Experience
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{doctor.experience}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              Rating
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {doctor.rating} ({doctor.reviews} reviews)
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Menu className="h-4 w-4" />
          <span>{doctor.hospital}</span>
        </div>

        <div
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
            doctor.availabilityTone === "today" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", doctor.availabilityTone === "today" ? "bg-emerald-500" : "bg-slate-400")} />
          {doctor.availability}
        </div>
      </div>

      <button
        type="button"
        className={cn(
          "mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg border text-sm font-medium transition-colors",
          selected
            ? "border-emerald-700 bg-emerald-700 text-white"
            : "border-emerald-700 bg-transparent text-emerald-700 hover:bg-emerald-700 hover:text-white"
        )}
      >
        {selected ? "Selected" : "Select Doctor"}
      </button>
    </article>
  );
}

export function DoctorSelectionStep() {
  const [activeFilter, setActiveFilter] = useState<DoctorCategory>("All Specialists");
  const [searchTerm, setSearchTerm] = useState("");

  const visibleDoctors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesFilter = activeFilter === "All Specialists" || doctor.specialization === activeFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        doctor.name.toLowerCase().includes(normalizedSearch) ||
        doctor.specialization.toLowerCase().includes(normalizedSearch) ||
        doctor.hospital.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">Mediso</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Help"
            >
              <CircleHelp className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="ml-1 h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-emerald-100 to-slate-100"
              aria-label="User profile"
            >
              <span className="sr-only">User profile</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-[280px] shrink-0 border-r border-slate-200 bg-white/80 px-6 py-8 md:flex md:flex-col">
          <div className="mb-8 pl-2">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-700">Mediso</h2>
            <p className="mt-1 text-sm text-slate-500">Appointment Booking</p>
          </div>

          <nav className="flex flex-col gap-2">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-medium transition-colors",
                  item.active ? "bg-emerald-700 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <SidebarIcon icon={item.icon} active={item.active} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-hidden px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 pb-6">
            <section className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.5rem]">Choose Your Doctor</h1>
              <p className="text-base text-slate-600 sm:text-lg">Select a doctor for your appointment.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    type="text"
                    placeholder="Search by name or specialization..."
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                  {filters.map((filter) => {
                    const active = activeFilter === filter;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={cn(
                          "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-emerald-700 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              {visibleDoctors.map((doctor) => (
                <DoctorCardView key={doctor.id} doctor={doctor} />
              ))}
            </section>

            <section className="flex justify-end border-t border-slate-200 pt-6">
              <Link
                href="/booking/date-time"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800"
              >
                Continue to Date &amp; Time
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}