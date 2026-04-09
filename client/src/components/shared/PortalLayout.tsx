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
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar role={role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PortalHeader role={role} />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
