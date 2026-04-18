"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarClock,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "@/helpers/cn";
import { useAppSelector } from "@/store/hooks";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const navByRole: Record<UserRole, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
  ],
  doctor: [
    { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/appointments-list", label: "Appointments", icon: CalendarCheck },
    { href: "/doctor/appointments", label: "Visit Updates", icon: CalendarDays },
    { href: "/doctor/patients", label: "Patients", icon: Stethoscope },
    { href: "/doctor/schedules", label: "Schedules", icon: CalendarClock },
  ],
  patient: [
    { href: "/patient", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patient/appointments", label: "Appointments", icon: CalendarDays },
  ],
};

const settingsHref: Record<UserRole, string> = {
  admin: "/admin/settings",
  doctor: "/doctor/settings",
  patient: "/patient/settings",
};

interface SidebarProps {
  role: UserRole;
  onNavigate?: () => void;
}

export function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = role === "admin";

  const activeBorder = isAdmin
    ? "border-blue-600 bg-blue-50 text-blue-700"
    : "border-emerald-600 bg-emerald-50 text-emerald-800";
  const brandBg = isAdmin ? "bg-blue-600" : "bg-emerald-600";
  const BrandIcon = isAdmin ? Shield : Activity;

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function isActive(href: string): boolean {
    if (href === "/admin" || href === "/doctor" || href === "/patient") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const settingsActive = pathname === settingsHref[role];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-5">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-white", brandBg)}>
          <BrandIcon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-foreground">Mediso</p>
          <p className="truncate text-xs text-muted">{isAdmin ? "Admin console" : `${role} portal`}</p>
        </div>
      </div>

      {/* Main nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted">Menu</p>
        <nav className="space-y-0.5">
          {navByRole[role].map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? activeBorder : "border-transparent text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Settings + user strip */}
      <div className="mt-auto border-t border-border px-3 py-4 space-y-1">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted">More</p>

        {/* Settings link */}
        <Link
          href={settingsHref[role]}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors",
            settingsActive
              ? activeBorder
              : "border-transparent text-slate-600 hover:bg-slate-50"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={2} />
          Settings
        </Link>

      </div>
    </aside>
  );
}
