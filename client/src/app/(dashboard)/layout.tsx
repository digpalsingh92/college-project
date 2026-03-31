'use client';
import { Sidebar } from '@/components/common/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <div className="relative flex min-h-screen w-full bg-transparent">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#25395f] bg-[#060c18]/90 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#25395f] text-[#94a7c8] transition-all duration-200 hover:border-[#26c5b4]/50 hover:text-[#eaf1ff] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#94a7c8]">Care Workspace</p>
              <p className="text-sm font-semibold text-[#eaf1ff] sm:text-base">{user?.role ? `${user.role} portal` : 'Dashboard'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[#25395f] text-[#94a7c8] transition-all duration-200 hover:border-[#26c5b4]/50 hover:text-[#eaf1ff]">
              <Bell className="w-4 h-4" />
            </button>
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1f9d8f] to-[#1f83c2] text-xs font-bold text-white">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-[#eaf1ff]">{user.name}</p>
                  <p className="text-xs capitalize text-[#94a7c8]">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="page-shell">{children}</div>
        </main>
      </div>
    </div>
  );
}
