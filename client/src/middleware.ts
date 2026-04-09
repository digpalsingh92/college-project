import { NextRequest } from "next/server";
import { withRoleGuard } from "@/middleware/index";

export function middleware(request: NextRequest) {
  return withRoleGuard(request);
}

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/patient/:path*"],
};
