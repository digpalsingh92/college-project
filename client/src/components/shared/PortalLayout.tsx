"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { PortalHeader } from "@/components/shared/PortalHeader";
import type { UserRole } from "@/types";
import { useLiveOperationsTelemetry } from "@/hooks/useLiveOperationsTelemetry";

interface PortalLayoutProps {
  role: UserRole;
  children: ReactNode;
}

export function PortalLayout({ role, children }: PortalLayoutProps) {
  // Activate live database operations telemetry over WebSockets
  useLiveOperationsTelemetry();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f3f4f6]">
      <div className="hidden h-full lg:block">
        <Sidebar role={role} />
      </div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="absolute inset-y-0 left-0 w-[18rem] max-w-[85vw]">
            <Sidebar role={role} onNavigate={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PortalHeader role={role} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

