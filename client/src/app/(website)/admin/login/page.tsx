"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useLoginAdminMutation } from "@/store/apiSlice";

function getLoginErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      data?: { message?: string };
      message?: string;
    };

    if (typeof candidate.data?.message === "string") return candidate.data.message;
    if (typeof candidate.message === "string") return candidate.message;
  }

  return "Admin login failed. Please try again.";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginAdmin, { isLoading }] = useLoginAdminMutation();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    router.replace(ROUTES.unauthorized);
  }, [isAuthenticated, user, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await loginAdmin({ email, password }).unwrap();

      if (result.user.role !== "admin") {
        toast.error("Only admin accounts can sign in here.");
        return;
      }

      toast.success("Admin logged in successfully");
      router.replace("/admin/dashboard");
    } catch (error) {
      toast.error(getLoginErrorMessage(error));
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="text-sm text-muted">
          Admin accounts are created via command only. Staff login?{" "}
          <Link href={ROUTES.login} className="font-medium text-emerald-700 hover:underline">
            Go to user sign in
          </Link>
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Admin email"
          type="email"
          autoComplete="email"
          placeholder="admin@hospitals.com"
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
        <Button type="submit" variant="admin" className="w-full" loading={isLoading} disabled={isLoading}>
          Sign in to Admin
        </Button>
      </form>
    </section>
  );
}
