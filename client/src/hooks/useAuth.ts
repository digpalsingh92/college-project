"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { useLogoutUserMutation } from "@/store/apiSlice";
import type { AuthUser } from "@/types";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [logoutUser] = useLogoutUserMutation();

  const signOut = useCallback(async () => {
    const isDoctor = user?.role === "doctor";
    try {
      await logoutUser().unwrap();
    } catch {
      // Ignore errors on logout
    }
    dispatch(logout());
    if (isDoctor) {
      router.push("/doctor/login");
    } else {
      router.push("/login");
    }
  }, [dispatch, router, logoutUser, user]);

  const roleHome = useMemo(() => {
    if (!user) return ROUTES.home;
    return ROLE_HOME[user.role as keyof typeof ROLE_HOME];
  }, [user]);

  return {
    token,
    user: user as AuthUser | null,
    isAuthenticated,
    signOut,
    roleHome,
  };
}
