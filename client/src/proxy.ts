import { NextRequest } from "next/server";
import { withRoleGuard } from "@/middleware-guard";

export function proxy(request: NextRequest) {
  return withRoleGuard(request);
}

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/patient/:path*"],
};
