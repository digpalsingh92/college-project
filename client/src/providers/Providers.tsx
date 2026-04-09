"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { Toaster, toast } from "sonner";
import { getJwtExpiryMs } from "@/lib/auth";
import { hydrateFromStorage, logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { store } from "@/store/store";

function SessionExpiryWatcher() {
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;
    const expMs = getJwtExpiryMs(token);
    if (!expMs) return;
    const delay = expMs - Date.now();
    if (delay <= 0) {
      dispatch(logout());
      toast.error("Session expired. Please sign in again.");
      return;
    }
    const id = window.setTimeout(() => {
      dispatch(logout());
      toast.error("Session expired. Please sign in again.");
    }, delay);
    return () => window.clearTimeout(id);
  }, [token, dispatch]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateFromStorage());
  }, []);

  return (
    <Provider store={store}>
      <SessionExpiryWatcher />
      {children}
      <Toaster richColors position="top-center" />
    </Provider>
  );
}
