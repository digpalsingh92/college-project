'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Calendar, Users, Activity,
  ClipboardList, BarChart2, LogOut, Settings,
  HeartPulse, X
} from 'lucide-react';

const patientNav = [
  { href: '/patient/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/patient/appointments', label: 'Appointments', icon: Calendar },
  { href: '/patient/reports',      label: 'AI Reports',   icon: Activity },
];

const doctorNav = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/patients',  label: 'Patients',  icon: Users },
  { href: '/doctor/schedule',  label: 'Schedule',  icon: ClipboardList },
];

const adminNav = [
  { href: '/admin/dashboard',    label: 'Dashboard',    icon: BarChart2 },
  { href: '/admin/users',        label: 'Admins',       icon: Users },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
];

const roleNavMap: Record<string, typeof patientNav> = {
  patient: patientNav,
  doctor: doctorNav,
  admin: adminNav,
  superadmin: adminNav,
};

const roleColorMap: Record<string, string> = {
  patient: 'from-blue-500 to-cyan-500',
  doctor: 'from-purple-500 to-pink-500',
  admin: 'from-emerald-500 to-teal-500',
  superadmin: 'from-orange-500 to-red-500',
};

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const navItems = (user?.role && roleNavMap[user.role]) || [];
  const avatarGradient = (user?.role && roleColorMap[user.role]) || 'from-blue-500 to-purple-500';

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-[17rem] flex-col border-r border-[#25395f] bg-[#0b1428] transition-transform duration-300 lg:sticky lg:top-0 lg:z-10 lg:w-72 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-[#25395f] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1f9d8f] to-[#1f83c2] shadow-lg shadow-[#1f83c2]/30">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#eaf1ff]">MedCare</h1>
            <p className="text-xs capitalize text-[#94a7c8]">{user?.role ?? 'Portal'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#25395f] text-[#94a7c8] transition-all duration-200 hover:border-[#26c5b4]/50 hover:text-[#eaf1ff] lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <div className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-[#1f9d8f]/15 text-[#73efe3] border-l-[3px] border-[#26c5b4] pl-[11px]'
                  : 'text-[#94a7c8] hover:bg-white/5 hover:text-[#eaf1ff]'
              )}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom: user + settings + logout */}
      <div className="space-y-1 border-t border-[#25395f] p-3">
        {/* User card */}
        {user && (
          <div className="mb-1 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-xs font-bold text-white`}>
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-[#eaf1ff]">{user.name}</p>
              <p className="truncate text-xs text-[#94a7c8]">{user.email}</p>
            </div>
          </div>
        )}
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#94a7c8] transition-all duration-200 hover:bg-white/5 hover:text-[#eaf1ff]">
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </button>
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#94a7c8] transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
      </aside>
    </>
  );
}
