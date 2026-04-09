"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import type { AuthUser } from "@/types";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const signOut = useCallback(() => {
    dispatch(logout());
    router.push("/login");
  }, [dispatch, router]);

  const roleHome = useMemo(() => {
    if (!user) return ROUTES.home;
    return ROLE_HOME[user.role];
  }, [user]);

  return {
    token,
    user: user as AuthUser | null,
    isAuthenticated,
    signOut,
    roleHome,
  };
}
