import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types";

const protectedPrefixes: Record<UserRole, string> = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
};

const COOKIE_NAME = "auth_token";

type JwtPayload = {
  role?: unknown;
  exp?: unknown;
};

function decodeJwtPayload(token: string | undefined): JwtPayload | null {
  if (!token) return null;

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    const normalizedSegment = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalizedSegment.padEnd(
      normalizedSegment.length + ((4 - (normalizedSegment.length % 4)) % 4),
      "="
    );

    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function getRole(payload: JwtPayload | null): UserRole | null {
  const role = payload?.role;
  return role === "admin" || role === "doctor" || role === "patient" ? role : null;
}

function isTokenExpired(payload: JwtPayload | null): boolean {
  const exp = payload?.exp;
  if (typeof exp !== "number") return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return nowInSeconds >= exp;
}

export function withRoleGuard(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = decodeJwtPayload(token);
  const role = getRole(payload);
  const expired = isTokenExpired(payload);
  const path = request.nextUrl.pathname;

  if (path === "/admin/login" || path === "/doctor/login" || path === "/doctor/register") {
    return NextResponse.next();
  }

  const requestedRole = (Object.keys(protectedPrefixes) as UserRole[]).find((key) =>
    path.startsWith(protectedPrefixes[key])
  );

  if (!requestedRole) {
    return NextResponse.next();
  }

  if (!role || expired) {
    const loginPath =
      requestedRole === "admin"
        ? "/admin/login"
        : requestedRole === "doctor"
        ? "/doctor/login"
        : "/login";
    const response = NextResponse.redirect(new URL(loginPath, request.url));
    response.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return response;
  }

  if (role !== requestedRole) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}
