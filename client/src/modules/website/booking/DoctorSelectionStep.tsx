"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, type ComponentType } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  X,
  CircleHelp,
  Clock3,
  Landmark,
  LayoutList,
  MapPin,
  Menu,
  Search,
  ShieldPlus,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/helpers/cn";
import { useGetDoctorsQuery } from "@/store/apiSlice";

type DoctorCategory = "All Specialists" | "Cardiologist" | "Dermatologist" | "Neurologist" | "Gastroenterologist";

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

const filters: DoctorCategory[] = ["All Specialists", "Cardiologist", "Dermatologist", "Neurologist", "Gastroenterologist"];

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
        "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shrink-0",
        active ? "ring-2 ring-[#006c49]/20" : "ring-1 ring-slate-200"
      )}
    >
      <div className="flex h-full w-full items-center justify-center bg-[#006c49]/10 text-base font-bold text-[#006c49]">
        {initials}
      </div>
      <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
    </div>
  );
}

function DoctorCardView({ doctor, isSelected, onSelect }: { doctor: DoctorCard; isSelected?: boolean; onSelect?: () => void }) {
  const selected = Boolean(isSelected);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.();
      }}
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-xl border bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)] cursor-pointer group transition-all duration-300",
        selected
          ? "border-2 border-[#006c49] shadow-[0_8px_12px_rgba(0,0,0,0.08)] scale-[1.02]"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-[#006c49]/50 hover:shadow-[0_8px_12px_rgba(0,0,0,0.08)]"
      )}
      aria-pressed={selected}
    >
      {selected ? (
        <div className="absolute top-4 right-4 bg-[#006c49] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm z-10">
          <Check className="h-4 w-4 stroke-[3px]" />
        </div>
      ) : null}

      <div className="flex items-center gap-4 pr-8">
        <DoctorAvatar name={doctor.name} active={selected} />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#006c49] transition-colors">{doctor.name}</h3>
          <p className="text-sm font-semibold text-[#006c49]">{doctor.specialization}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
            Experience
          </span>
          <span className="text-sm font-bold text-slate-800">{doctor.experience}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            Rating
          </span>
          <span className="text-sm font-bold text-slate-800">
            {doctor.rating} ({doctor.reviews} reviews)
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>{doctor.hospital}</span>
        </div>

        <div className={cn(
          "mt-2 inline-flex w-max items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
          doctor.availabilityTone === "today"
            ? "bg-[#006c49]/10 text-[#006c49]"
            : "bg-slate-100 text-slate-500"
        )}>
          <span className={cn(
            "h-2 w-2 rounded-full",
            doctor.availabilityTone === "today" ? "bg-[#006c49] animate-pulse" : "bg-slate-400"
          )} />
          {doctor.availability}
        </div>
      </div>

      <button
        type="button"
        className={cn(
          "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all duration-200",
          selected
            ? "bg-[#006c49] text-white hover:bg-[#005236]"
            : "border border-[#006c49] bg-transparent text-[#006c49] hover:bg-[#006c49] hover:text-white"
        )}
      >
        {selected ? "Selected" : "Select Doctor"}
      </button>
    </article>
  );
}

function SidebarIcon({ icon: Icon, active = false }: { icon: ComponentType<{ className?: string }>; active?: boolean }) {
  return <Icon className={cn("h-4 w-4", active ? "text-on-primary" : "text-secondary")} aria-hidden />;
}

export function DoctorSelectionStep() {
  const [activeFilter, setActiveFilter] = useState<DoctorCategory>("All Specialists");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // Retrieve all doctors for tab count statistics
  const { data: allDoctorsData } = useGetDoctorsQuery();

  // Retrieve filtered doctors reactively from the backend API
  const { data: filteredDoctorsData, isLoading } = useGetDoctorsQuery({
    search: searchTerm.trim() || undefined,
    specialization: activeFilter === "All Specialists" ? undefined : activeFilter,
  });

  const doctorCounts = useMemo(() => {
    const list = allDoctorsData?.doctors ?? [];
    return filters.map((filter) => {
      const count =
        filter === "All Specialists"
          ? list.length
          : list.filter((d) => d.doctorProfile?.specialization === filter).length;

      return { filter, count };
    });
  }, [allDoctorsData]);

  const visibleDoctors: DoctorCard[] = useMemo(() => {
    const list = filteredDoctorsData?.doctors ?? [];
    return list.map((doc) => {
      // Deterministic ratings and reviews for clean rendering aesthetics
      const ratingVal = 4.5 + (doc.name.length % 5) * 0.1;
      const reviewsCount = 50 + (doc.name.length % 10) * 15;
      const isToday = doc.name.length % 2 === 0;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.doctorProfile?.specialization ?? "General Physician",
        experience: `${doc.doctorProfile?.experience ?? 5} Years`,
        rating: ratingVal.toFixed(1),
        reviews: reviewsCount,
        hospital: doc.name.length % 3 === 0 ? "Mediso Skin Center" : "Mediso General Hospital",
        availability: isToday ? "Available Today" : "Available Tomorrow",
        availabilityTone: isToday ? "today" : "tomorrow",
      };
    });
  }, [filteredDoctorsData]);

  // Auto-select first available doctor on load or query refilter
  useEffect(() => {
    if (visibleDoctors.length > 0) {
      const isStillVisible = visibleDoctors.some((d) => d.id === selectedDoctorId);
      if (!isStillVisible) {
        setSelectedDoctorId(visibleDoctors[0].id);
      }
    } else {
      setSelectedDoctorId(null);
    }
  }, [visibleDoctors, selectedDoctorId]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight text-[#006c49]">Mediso</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button type="button" className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Help">
              <CircleHelp className="h-5 w-5" />
            </button>
            <button type="button" className="ml-1 h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-linear-to-br from-emerald-100 to-slate-100" aria-label="User profile">
              <span className="sr-only">User profile</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-70 shrink-0 border-r border-slate-200 bg-white/80 px-6 py-8 md:flex md:flex-col">
          <div className="mb-8 pl-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#006c49]">Mediso</h2>
            <p className="mt-1 text-sm text-slate-500">Appointment Booking</p>
          </div>

          <nav className="flex flex-col gap-2">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-medium transition-colors",
                  item.active ? "bg-[#006c49] text-white shadow-sm font-semibold" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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

            <section className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 items-center shadow-sm">
              <div className="relative w-full flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  type="text"
                  placeholder="Search by name or specialization..."
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] transition-colors"
                />
                {searchTerm.length > 0 ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex gap-2 max-w-[320px] sm:max-w-[440px] overflow-x-auto flex-nowrap hide-scrollbar shrink-0 py-1">
                {doctorCounts.map(({ filter, count }) => {
                  const active = activeFilter === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full border transition-all flex items-center gap-2",
                        active
                          ? "border-[#006c49]/20 bg-[#006c49]/10 text-[#006c49]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span>{filter}</span>
                      <span className="ml-1 rounded-full bg-slate-100 px-2 text-xs text-slate-600">{count}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm flex flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006c49] border-t-transparent mb-4" />
                <p className="text-lg font-semibold text-slate-900">Loading healthcare providers...</p>
                <p className="mt-1 text-sm text-slate-500">Searching Mediso database.</p>
              </div>
            ) : (
              <>
                <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleDoctors.map((doctor) => (
                    <DoctorCardView
                      key={doctor.id}
                      doctor={doctor}
                      isSelected={selectedDoctorId === doctor.id}
                      onSelect={() => setSelectedDoctorId(doctor.id)}
                    />
                  ))}
                </section>

                {visibleDoctors.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                    <p className="text-lg font-semibold text-slate-900">No doctors matched your search.</p>
                    <p className="mt-2 text-sm text-slate-600">Try a different specialization or clear the search field.</p>
                  </div>
                ) : null}
              </>
            )}

            <section className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
              <Link
                href={selectedDoctorId ? `/booking/date-time?doctorId=${selectedDoctorId}` : "#"}
                onClick={(e) => {
                  if (!selectedDoctorId) {
                    e.preventDefault();
                    alert("Please select a doctor to continue.");
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-bold shadow-sm transition-all duration-200",
                  selectedDoctorId
                    ? "bg-[#006c49] text-white hover:bg-[#005236]"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                )}
              >
                <span>Continue to Date &amp; Time</span>
                <ArrowRight className="h-4 w-4 stroke-[3px]" />
              </Link>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}