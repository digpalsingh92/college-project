import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types";

const protectedPrefixes: Record<UserRole, string> = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
};

function getRoleFromToken(token: string | undefined): UserRole | null {
  if (!token) return null;

  try {
    const payloadSegment = token.split(".")[1] ?? "";
    const normalizedSegment = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalizedSegment));
    const role = payload?.role;
    return role === "admin" || role === "doctor" || role === "patient" ? role : null;
  } catch {
    return null;
  }
}

export function withRoleGuard(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const role = getRoleFromToken(token);
  const path = request.nextUrl.pathname;

  const requestedRole = (Object.keys(protectedPrefixes) as UserRole[]).find((key) =>
    path.startsWith(protectedPrefixes[key])
  );

  if (!requestedRole) {
    return NextResponse.next();
  }

  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role !== requestedRole) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}
