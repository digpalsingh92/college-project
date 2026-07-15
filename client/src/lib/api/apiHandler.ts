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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

class ApiHandler {
  private readonly client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers["Authorization"] = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const { store } = await import("@/store/store");
            const { setCredentials, mapAuthUserDto } = await import("@/store/authSlice");
            const state = store.getState();
            const refreshToken =
              state.auth.refreshToken ||
              (typeof window !== "undefined" ? localStorage.getItem("auth_refresh_token") : null);

            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
            const resultEnvelope = response.data;
            const resultData = resultEnvelope.result?.data || resultEnvelope;

            const token = resultData.token;
            const newRefreshToken = resultData.refreshToken;
            const user = resultData.user;

            store.dispatch(
              setCredentials({
                token,
                refreshToken: newRefreshToken,
                user: mapAuthUserDto(user),
              })
            );

            processQueue(null, token);
            isRefreshing = false;

            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;

            try {
              const { store } = await import("@/store/store");
              const { logout } = await import("@/store/authSlice");
              store.dispatch(logout());
            } catch {}

            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
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