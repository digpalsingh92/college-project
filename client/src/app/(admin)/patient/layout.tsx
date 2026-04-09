import { ReactNode } from "react";
import { PortalLayout } from "@/components/shared/PortalLayout";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return <PortalLayout role="patient">{children}</PortalLayout>;
}
