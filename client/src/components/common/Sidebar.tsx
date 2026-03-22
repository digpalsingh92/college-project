'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Calendar, Users, Activity,
  ClipboardList, BarChart2, LogOut, Settings,
  HeartPulse, Stethoscope, FileText, Bell
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const navItems = (user?.role && roleNavMap[user.role]) || [];
  const avatarGradient = (user?.role && roleColorMap[user.role]) || 'from-blue-500 to-purple-500';

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#1e2d4a] bg-[#0f1629] sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e2d4a]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#e8eaf0]">MedCare</h1>
          <p className="text-xs text-[#8892a4] capitalize">{user?.role ?? 'Portal'}</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-blue-600/15 text-blue-400 border-l-[3px] border-blue-500 pl-[11px]'
                  : 'text-[#8892a4] hover:text-[#e8eaf0] hover:bg-white/5'
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom: user + settings + logout */}
      <div className="border-t border-[#1e2d4a] p-3 space-y-1">
        {/* User card */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#e8eaf0] truncate">{user.name}</p>
              <p className="text-xs text-[#8892a4] truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#8892a4] hover:text-[#e8eaf0] hover:bg-white/5 transition-all duration-200">
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#8892a4] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
