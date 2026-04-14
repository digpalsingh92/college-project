"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { ROUTES, ROLE_HOME } from "@/constants/routes";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <header className="border-b border-slate-200/80 bg-surface shadow-sm">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Activity className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">Mediso</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <Link href={ROUTES.about} className="hover:text-slate-900">
            About
          </Link>
          <Link href={ROUTES.contact} className="hover:text-slate-900">
            Contact
          </Link>
          {isAuthenticated && user ? (
            <>
              {user.role === "patient" ? (
                <Link href={ROUTES.booking} className="font-medium text-emerald-700 hover:text-emerald-800">
                  Book visit
                </Link>
              ) : null}
              <Link href={ROLE_HOME[user.role]} className="font-medium text-emerald-700 hover:text-emerald-800">
                Dashboard
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.register} className="hover:text-slate-900">
                Register
              </Link>
              <Link
                href={ROUTES.login}
                className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
