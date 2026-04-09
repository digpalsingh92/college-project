import type { UserRole } from "@/types";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const COOKIE_NAME = "auth_token";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp === "number") return exp * 1000;
  return null;
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const expMs = getJwtExpiryMs(token);
  if (!expMs) return false;
  return Date.now() >= expMs - 5000;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUserJson(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(USER_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function setStoredUserJson(json: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, json);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function setAuthCookie(token: string): void {
  if (typeof window === "undefined") return;
  const expMs = getJwtExpiryMs(token);
  const maxAgeSeconds = expMs
    ? Math.max(0, Math.floor((expMs - Date.now()) / 1000))
    : 3600;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function getRoleFromToken(token: string | null): UserRole | null {
  if (!token) return null;

  try {
    const payload = decodeJwtPayload(token);
    const role = payload?.role;
    return role === "admin" || role === "doctor" || role === "patient" ? role : null;
  } catch {
    return null;
  }
}
