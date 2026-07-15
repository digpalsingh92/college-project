"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { mapAuthUserDto, setCredentials } from "@/store/authSlice";
import { useRegisterDoctorMutation } from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/store/hooks";
import type { UserRole } from "@/types";

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("0");
  const [consultationFee, setConsultationFee] = useState("0");

  const [registerDoctor, { isLoading: loadingDoctor }] = useRegisterDoctorMutation();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await registerDoctor({
        name,
        email,
        password,
        specialization,
        experience: Number(experience),
        consultationFee: Number(consultationFee),
      }).unwrap();

      dispatch(
        setCredentials({
          token: result.token,
          refreshToken: result.refreshToken,
          user: mapAuthUserDto(result.user),
        })
      );
      router.replace(ROLE_HOME[result.user.role as UserRole]);
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
        <h1 className="text-2xl font-semibold">Doctor Registration</h1>
        <p className="text-sm text-muted">
          Create your clinician account. Registered already?{" "}
          <Link href={ROUTES.doctorLogin} className="font-medium text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
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

        <Button type="submit" className="w-full" loading={loadingDoctor} disabled={loadingDoctor}>
          Create doctor account
        </Button>
      </form>

      <div className="text-center pt-4 border-t border-slate-100">
        <p className="text-sm text-slate-500">
          Are you a patient?{" "}
          <Link href={ROUTES.register} className="font-medium text-emerald-700 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </section>
  );
}
