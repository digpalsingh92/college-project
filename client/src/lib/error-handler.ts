import { AxiosError } from "axios";
import { ApiError } from "@/types";
import type { ApiErrorBody } from "@/types/api";

export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined;
    return {
      message: data?.message ?? error.message,
      status: error.response?.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return { message: "Unexpected error occurred." };
}
