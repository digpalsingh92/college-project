import { ReactNode } from "react";
import { PortalLayout } from "@/components/shared/PortalLayout";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return <PortalLayout role="doctor">{children}</PortalLayout>;
}
