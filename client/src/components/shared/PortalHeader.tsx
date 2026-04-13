"use client";

import { Bell, Search } from "lucide-react";
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
    return "Schedule, visits, and your practice overview.";
  }
  return "Book visits and track your health journey.";
}

interface PortalHeaderProps {
  role: UserRole;
}

export function PortalHeader({ role }: PortalHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = titleForPath(pathname ?? "", role);
  const subtitle = subtitleForPath(pathname ?? "", role);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end md:w-auto">
          <div className="relative hidden min-w-[220px] sm:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              aria-label="Search"
              placeholder="Search…"
              className="h-10 border-slate-200 bg-slate-50 pl-9 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-surface text-slate-600 hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-surface" />
            </button>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-2 pr-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white">
                {(user?.name ?? "?")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "Guest"}</p>
                <p className="truncate text-xs capitalize text-muted">{user?.role ?? ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
