'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, CheckCircle2, Users, ChevronRight, Check, X, ArrowUpRight } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { adminApi, doctorApi, patientApi } from '@/lib/api';
import { Appointment, Doctor } from '@/types';
import { formatDateTime, getInitials, extractApiError } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';

const statIcons: Record<string, { icon: typeof Calendar; bg: string; color: string }> = {
  appointments: { icon: Calendar,      bg: 'bg-blue-500/10',    color: 'text-blue-400' },
  pending:      { icon: Clock,         bg: 'bg-yellow-500/10',  color: 'text-yellow-400' },
  doctors:      { icon: Users,         bg: 'bg-green-500/10',   color: 'text-green-400' },
  completed:    { icon: CheckCircle2,  bg: 'bg-indigo-500/10',  color: 'text-indigo-400' },
};

export default function AdminDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [drRes] = await Promise.all([doctorApi.getAll()]);
        setDoctors(drRes.data.doctors ?? []);
      } catch {/* ignore */}
      setLoading(false);
    };
    load();
  }, []);

  const pending    = appointments.filter((a) => a.status === 'pending');
  const completed  = appointments.filter((a) => a.status === 'completed').length;
  const stats = [
    { key: 'appointments', label: 'Total Appointments', value: appointments.length },
    { key: 'pending',      label: 'Pending Approvals',  value: pending.length },
    { key: 'doctors',      label: 'Active Doctors',     value: doctors.filter((d) => d.isActive && d.isVerified).length },
    { key: 'completed',    label: 'Total Completed',    value: completed },
  ];

  if (loading) return <Spinner text="Loading dashboard…" />;

  return (
    <div className="animate-fadein">
      {/* Page header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf0]">Admin Dashboard</h1>
          <p className="text-sm text-[#8892a4] mt-1">Manage your healthcare platform</p>
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => {
          const { icon: Icon, bg, color } = statIcons[s.key];
          return (
            <div key={s.key} className="flex items-start justify-between rounded-xl p-5 bg-[#0f1629] border border-[#1e2d4a]">
              <div>
                <p className="text-[#8892a4] text-sm font-medium">{s.label}</p>
                <p className="text-[#e8eaf0] text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </section>

      {/* Main grid — 2/3 table + 1/3 pending panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Appointments table */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#e8eaf0]">Recent Appointments</h2>
            <Link href="/admin/appointments" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#1e2d4a] bg-[#0f1629]">
            <table className="w-full text-left">
              <thead className="bg-[#141d35]">
                <tr>
                  {['ID', 'Patient', 'Doctor', 'Date & Time', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[#8892a4] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {appointments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#8892a4] text-sm">No appointments yet</td></tr>
                ) : appointments.slice(0, 6).map((a) => (
                  <tr key={a.id} className="hover:bg-[#141d35] transition-colors">
                    <td className="px-4 py-3 text-xs text-[#8892a4] font-mono">#{a.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-[#e8eaf0]">{a.patientId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-[#8892a4]">{a.doctorId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-[#8892a4]">{formatDateTime(a.appointmentDate)}</td>
                    <td className="px-4 py-3">
                      <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending approvals panel */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-[#e8eaf0] mb-4">Pending Approvals</h2>
          <div className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] overflow-hidden">
            {pending.length === 0 ? (
              <p className="px-4 py-8 text-center text-[#8892a4] text-sm">No pending approvals</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#141d35]">
                  <tr>
                    {['Patient', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold text-[#8892a4] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d4a]">
                  {pending.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-[#141d35] transition-colors">
                      <td className="px-3 py-2.5 text-sm text-[#e8eaf0]">{a.patientId.slice(0, 8)}</td>
                      <td className="px-3 py-2.5 text-xs text-[#8892a4]">{formatDateTime(a.appointmentDate)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <button className="p-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                          <button className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Doctors grid */}
      <div>
        <h2 className="text-xl font-bold text-[#e8eaf0] mb-4">Active Doctors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {doctors.length === 0 ? (
            <p className="text-[#8892a4] text-sm">No doctors found.</p>
          ) : doctors.slice(0, 8).map((d) => (
            <div key={d.id} className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] p-5 flex flex-col items-center text-center hover:border-blue-500/30 transition-all duration-200">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white">
                  {getInitials(d.name)}
                </div>
                <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0f1629] ${d.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>
              <p className="font-semibold text-[#e8eaf0] text-sm">{d.name}</p>
              <p className="text-xs text-[#8892a4] mb-2">{d.specialization}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                d.isVerified ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
              }`}>
                {d.isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
