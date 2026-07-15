"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { mapAuthUserDto, setCredentials } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { useLoginDoctorMutation } from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";

function getLoginErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      data?: { message?: string };
      message?: string;
    };

    if (typeof candidate.data?.message === "string") {
      return candidate.data.message;
    }

    if (typeof candidate.message === "string") {
      return candidate.message;
    }
  }

  return "Login failed. Please try again.";
}

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginDoctor, { isLoading: loadingDoctor }] = useLoginDoctorMutation();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await loginDoctor({ email, password }).unwrap();

      const mappedUser = mapAuthUserDto(result.user);
      const destination = ROLE_HOME[mappedUser.role] ?? ROUTES.doctor;

      dispatch(
        setCredentials({
          token: result.token,
          refreshToken: result.refreshToken,
          user: mappedUser,
        })
      );
      toast.success("Logged in successfully");
      router.replace(destination);
    } catch (error) {
      toast.error(getLoginErrorMessage(error));
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
        <h1 className="text-2xl font-semibold">Doctor Sign in</h1>
        <p className="text-sm text-muted">
          Access your clinician dashboard. New here?{" "}
          <Link href={ROUTES.doctorRegister} className="font-medium text-emerald-700 hover:underline">
            Register as Doctor
          </Link>
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="doctor@example.com"
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
        <Button type="submit" className="w-full" loading={loadingDoctor} disabled={loadingDoctor}>
          Continue
        </Button>
      </form>

      <div className="text-center pt-4 border-t border-slate-100">
        <p className="text-sm text-slate-500">
          Are you a patient?{" "}
          <Link href={ROUTES.login} className="font-medium text-emerald-700 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </section>
  );
}
