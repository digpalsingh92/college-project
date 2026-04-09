"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import type { UserRole } from "@/types";
import {
  useLoginDoctorMutation,
  useLoginPatientMutation,
} from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";

type RoleTab = "patient" | "doctor";

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState<RoleTab>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginPatient, { isLoading: loadingPatient }] = useLoginPatientMutation();
  const [loginDoctor, { isLoading: loadingDoctor }] = useLoginDoctorMutation();

  const loading = loadingPatient || loadingDoctor;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result =
        tab === "patient"
          ? await loginPatient({ email, password }).unwrap()
          : await loginDoctor({ email, password }).unwrap();
      router.push(ROLE_HOME[result.user.role as UserRole]);
      router.refresh();
    } catch {
      /* errors surfaced via API layer toasts */
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [isAuthenticated, user, router]);

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted">
          Use your patient or doctor account. New here?{" "}
          <Link href={ROUTES.register} className="font-medium text-emerald-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <div className="flex gap-2 rounded-lg border border-border p-1">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            tab === "patient" ? "bg-slate-200" : "hover:bg-slate-100"
          }`}
          onClick={() => setTab("patient")}
        >
          Patient
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            tab === "doctor" ? "bg-slate-200" : "hover:bg-slate-100"
          }`}
          onClick={() => setTab("doctor")}
        >
          Doctor
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Continue
        </Button>
      </form>
    </section>
  );
}
