import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { ApiErrorBody } from "@/types/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiHandlerError extends Error {
  readonly status?: number;
  readonly data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiHandlerError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  token?: string | null;
  params?: unknown;
  data?: unknown;
  headers?: Record<string, string>;
};

type ApiSuccessEnvelope<T> = {
  status: true;
  statusCode: number;
  message: string;
  result: {
    data: T;
  };
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

function getMessageFromAxiosError(error: AxiosError<ApiErrorBody>): string {
  const data = error.response?.data;
  if (data && typeof data.message === "string") return data.message;
  return error.message || "Request failed";
}

function isApiSuccessEnvelope<T>(payload: unknown): payload is ApiSuccessEnvelope<T> {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<ApiSuccessEnvelope<T>>;
  return (
    candidate.status === true &&
    typeof candidate.statusCode === "number" &&
    typeof candidate.message === "string" &&
    !!candidate.result &&
    typeof candidate.result === "object" &&
    "data" in candidate.result
  );
}

class ApiHandler {
  private readonly client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });
  }

  private async request<T>(method: HttpMethod, url: string, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await this.client.request<T>({
        url,
        method,
        data: options.data,
        params: options.params,
        headers: {
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(options.headers ?? {}),
        },
      });

      const payload = response.data as unknown;
      if (isApiSuccessEnvelope<T>(payload)) {
        return payload.result.data;
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorBody>;
      const status = axiosError.response?.status;
      const message = getMessageFromAxiosError(axiosError);
      throw new ApiHandlerError(message, status, axiosError.response?.data ?? { message });
    }
  }

  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", url, options);
  }

  post<T>(url: string, data?: unknown, options?: Omit<RequestOptions, "data">): Promise<T> {
    return this.request<T>("POST", url, { ...options, data });
  }

  put<T>(url: string, data?: unknown, options?: Omit<RequestOptions, "data">): Promise<T> {
    return this.request<T>("PUT", url, { ...options, data });
  }

  patch<T>(url: string, data?: unknown, options?: Omit<RequestOptions, "data">): Promise<T> {
    return this.request<T>("PATCH", url, { ...options, data });
  }

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", url, options);
  }
}

export const apiHandler = new ApiHandler(baseUrl);