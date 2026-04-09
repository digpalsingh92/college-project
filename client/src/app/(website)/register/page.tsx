"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import {
  useRegisterDoctorMutation,
  useRegisterPatientMutation,
} from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

type RoleTab = "patient" | "doctor";

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState<RoleTab>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("0");
  const [consultationFee, setConsultationFee] = useState("0");

  const [registerPatient, { isLoading: loadingPatient }] = useRegisterPatientMutation();
  const [registerDoctor, { isLoading: loadingDoctor }] = useRegisterDoctorMutation();

  const loading = loadingPatient || loadingDoctor;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result =
        tab === "patient"
          ? await registerPatient({ name, email, password }).unwrap()
          : await registerDoctor({
              name,
              email,
              password,
              specialization,
              experience: Number(experience),
              consultationFee: Number(consultationFee),
            }).unwrap();
      router.push(ROLE_HOME[result.user.role as UserRole]);
      router.refresh();
    } catch {
      /* toasts from API layer */
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
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted">
          Already registered?{" "}
          <Link href={ROUTES.login} className="font-medium text-emerald-700 hover:underline">
            Sign in
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
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          helperText="At least 6 characters."
        />

        {tab === "doctor" ? (
          <>
            <Input
              label="Specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              required
            />
            <Input
              label="Experience (years)"
              type="number"
              min={0}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
            />
            <Input
              label="Consultation fee"
              type="number"
              min={0}
              step="0.01"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              required
            />
          </>
        ) : null}

        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Create account
        </Button>
      </form>
    </section>
  );
}
