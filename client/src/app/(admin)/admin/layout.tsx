import { ReactNode } from "react";
import { PortalLayout } from "@/components/shared/PortalLayout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <PortalLayout role="admin">{children}</PortalLayout>;
}
