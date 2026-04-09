import { ReactNode } from "react";
import { WebsiteLayout } from "@/components/shared/WebsiteLayout";

export default function WebsiteGroupLayout({ children }: { children: ReactNode }) {
  return <WebsiteLayout>{children}</WebsiteLayout>;
}
