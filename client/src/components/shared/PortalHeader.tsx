"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import { Input } from "@/components/ui/Input";

function titleForPath(pathname: string, role: UserRole): string {
  if (pathname.endsWith("/settings")) return "Settings";
  if (role === "admin") {
    if (pathname.startsWith("/admin/users")) return "Users";
    return "Dashboard Overview";
  }
  if (role === "doctor") {
    if (pathname.startsWith("/doctor/patients")) return "Patients";
    if (pathname.startsWith("/doctor/schedules")) return "Schedules";
    if (pathname.startsWith("/doctor/resources")) return "Resource Blocker";
    return "Doctor dashboard";
  }
  if (pathname.startsWith("/patient/appointments")) return "Appointments";
  return "Patient care";
}

function subtitleForPath(pathname: string, role: UserRole): string {
  if (pathname.endsWith("/settings")) return "View your profile and manage your account.";
  if (role === "admin") {
    return "Quick summary of platform activity and tools.";
  }
  if (role === "doctor") {
    if (pathname.startsWith("/doctor/resources")) return "On-demand asset blocking and live telemetry.";
    return "Schedule, visits, and your practice overview.";
  }
  return "Book visits and track your health journey.";
}

interface PortalHeaderProps {
  role: UserRole;
  onMenuClick?: () => void;
}

export function PortalHeader({ role, onMenuClick }: PortalHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = titleForPath(pathname ?? "", role);
  const subtitle = subtitleForPath(pathname ?? "", role);

  return (
    <header className="sticky top-0 z-10 border-b border-emerald-700 bg-emerald-600 shadow-sm">
      <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-start gap-3">
          {onMenuClick ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500 bg-emerald-700 text-white hover:bg-emerald-800 transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5 text-emerald-100" />
            </button>
          ) : null}

          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">{title}</h1>
            <p className="mt-0.5 text-sm text-emerald-100/90 font-medium">{subtitle}</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end md:w-auto">

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500 bg-emerald-700 text-white hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-emerald-100" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-emerald-600" />
            </button>

            <div className="flex items-center gap-3 rounded-lg border border-emerald-500 bg-emerald-700 py-1.5 pl-2 pr-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#141414] text-sm font-bold text-emerald-700">
                {(user?.name ?? "?")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-white">{user?.name ?? "Guest"}</p>
                <p className="truncate text-xs capitalize text-emerald-200/90">{user?.role ?? ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
