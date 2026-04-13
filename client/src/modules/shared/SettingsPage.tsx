"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LogOut,
  Mail,
  Shield,
  Stethoscope,
  User,
  Activity,
  DollarSign,
  Clock,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { clearAuthCookie } from "@/lib/auth";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/types";
import { cn } from "@/helpers/cn";

const ROLE_CONFIG: Record<
  UserRole,
  { accent: string; accentText: string; accentBg: string; label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  doctor: {
    accent: "border-emerald-500",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-600",
    label: "Doctor Portal",
    Icon: Stethoscope,
  },
  patient: {
    accent: "border-blue-500",
    accentText: "text-blue-700",
    accentBg: "bg-blue-600",
    label: "Patient Portal",
    Icon: Activity,
  },
  admin: {
    accent: "border-violet-500",
    accentText: "text-violet-700",
    accentBg: "bg-violet-600",
    label: "Admin Console",
    Icon: Shield,
  },
};

interface SettingsPageProps {
  role: UserRole;
}

export function SettingsPage({ role }: SettingsPageProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const config = ROLE_CONFIG[role];
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      dispatch(logout());
      clearAuthCookie();
      toast.success("You've been signed out. See you soon!");
      // brief delay so toast shows before redirect
      await new Promise((r) => setTimeout(r, 600));
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your account preferences</p>
      </div>

      {/* Profile card */}
      <Card padding="md">
        <CardHeader title="My profile" description="Your account information" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg",
                config.accentBg
              )}
            >
              {initials}
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                config.accent,
                config.accentText,
                "bg-white"
              )}
            >
              <config.Icon className="h-3 w-3" />
              {config.label}
            </span>
          </div>

          {/* Info grid */}
          <div className="flex-1 space-y-4">
            <InfoRow icon={<User className="h-4 w-4 text-slate-400" />} label="Full name" value={user?.name ?? "—"} />
            <InfoRow icon={<Mail className="h-4 w-4 text-slate-400" />} label="Email address" value={user?.email ?? "—"} />
            <InfoRow
              icon={<Shield className="h-4 w-4 text-slate-400" />}
              label="Role"
              value={
                <span className="capitalize font-semibold">{user?.role ?? "—"}</span>
              }
            />

            {/* Doctor-specific extras */}
            {role === "doctor" && user?.doctorProfile && (
              <>
                <InfoRow
                  icon={<Stethoscope className="h-4 w-4 text-slate-400" />}
                  label="Specialization"
                  value={user.doctorProfile.specialization}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4 text-slate-400" />}
                  label="Experience"
                  value={`${user.doctorProfile.experience} years`}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-slate-400" />}
                  label="Consultation fee"
                  value={`₹${user.doctorProfile.consultationFee}`}
                />
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Account actions */}
      <Card padding="md">
        <CardHeader title="Account" description="Manage session and security" />

        <div className="space-y-3">
          {/* Logout */}
          <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-rose-800">Sign out</p>
              <p className="text-xs text-rose-500 mt-0.5">You'll need to log in again to access your account</p>
            </div>
            <Button
              variant="danger"
              onClick={handleLogout}
              loading={loggingOut}
              type="button"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </Card>

      {/* App info */}
      <div className="text-center text-xs text-muted py-4">
        Mediso Healthcare Platform · v1.0 · <span className="capitalize">{role}</span> access
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
