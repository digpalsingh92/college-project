"use client";

import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import type { ApiError } from "@/types";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export function useFetch<T>(path: string) {
  const token = useAppSelector((s) => s.auth.token);
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const url = path.startsWith("http") ? path : `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

    async function run() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await axios.get<T>(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!cancelled) {
          setState({ data: res.data, loading: false, error: null });
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError.response?.data?.message ?? axiosError.message ?? "Request failed";
        const status = axiosError.response?.status;
        if (!cancelled) {
          setState({ data: null, loading: false, error: { message, status } });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [path, token]);

  return state;
}
