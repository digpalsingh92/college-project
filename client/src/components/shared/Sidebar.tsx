"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "@/helpers/cn";
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
    { href: "/doctor/patients", label: "Patients", icon: Stethoscope },
  ],
  patient: [
    { href: "/patient", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patient/appointments", label: "Appointments", icon: CalendarDays },
  ],
};

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const isAdmin = role === "admin";

  const activeRing = isAdmin ? "border-blue-600 bg-blue-50 text-blue-700" : "border-emerald-600 bg-emerald-50 text-emerald-800";
  const brandIcon = isAdmin ? Shield : Activity;
  const BrandIcon = brandIcon;

  function isActive(href: string): boolean {
    if (href === "/admin" || href === "/doctor" || href === "/patient") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-5">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg text-white",
            isAdmin ? "bg-blue-600" : "bg-emerald-600"
          )}
        >
          <BrandIcon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-foreground">Mediso</p>
          <p className="truncate text-xs text-muted">{isAdmin ? "Admin console" : `${role} portal`}</p>
        </div>
      </div>

      <div className="px-3 py-4">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted">Menu</p>
        <nav className="space-y-0.5">
          {navByRole[role].map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? activeRing : "border-transparent text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-border px-3 py-4">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted">More</p>
        <nav className="space-y-0.5">
          <Link
            href="/about"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" strokeWidth={2} />
            Organization
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <HelpCircle className="h-4 w-4" strokeWidth={2} />
            Help center
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={2} />
            About
          </Link>
        </nav>
      </div>
    </aside>
  );
}
