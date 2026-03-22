'use client';
import { Sidebar } from '@/components/common/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { Bell } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);

  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <div className="relative flex min-h-screen w-full bg-[#0a0e1a]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Top header bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-[#1e2d4a] bg-[#0a0e1a]/80 backdrop-blur-sm">
          <div /> {/* Page title comes from each page */}
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center w-9 h-9 rounded-full border border-[#1e2d4a] text-[#8892a4] hover:text-[#e8eaf0] hover:border-blue-500/40 transition-all duration-200">
              <Bell className="w-4 h-4" />
            </button>
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-[#e8eaf0]">{user.name}</p>
                  <p className="text-xs text-[#8892a4] capitalize">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
