import { ReactNode } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { PortalHeader } from "@/components/shared/PortalHeader";
import type { UserRole } from "@/types";

interface PortalLayoutProps {
  role: UserRole;
  children: ReactNode;
}

export function PortalLayout({ role, children }: PortalLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f4f6]">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PortalHeader role={role} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

