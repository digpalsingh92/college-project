import { ReactNode } from "react";
import { Navbar } from "@/components/shared/Navbar";

interface WebsiteLayoutProps {
  children: ReactNode;
}

export function WebsiteLayout({ children }: WebsiteLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">{children}</main>
    </div>
  );
}
