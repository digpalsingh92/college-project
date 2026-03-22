'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, CheckCircle2, Activity, ArrowUpRight, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { patientApi, doctorApi } from '@/lib/api';
import { Appointment, Doctor } from '@/types';
import { formatDateTime, getInitials, extractApiError } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';

export default function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors]           = useState<Doctor[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, drRes] = await Promise.all([
          patientApi.getAppointments(),
          doctorApi.getAll(),
        ]);
        setAppointments(apptRes.data.appointments ?? []);
        setDoctors(drRes.data.doctors ?? []);
      } catch {/* ignore */}
      setLoading(false);
    };
    load();
  }, []);

  const upcoming  = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed');
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length;

  const stats = [
    { key: 'total',     label: 'Total Appointments', value: appointments.length, icon: Calendar,     bg: 'bg-blue-500/10',   color: 'text-blue-400' },
    { key: 'upcoming',  label: 'Upcoming',           value: upcoming.length,    icon: Clock,        bg: 'bg-yellow-500/10', color: 'text-yellow-400' },
    { key: 'completed', label: 'Completed',          value: completed,          icon: CheckCircle2, bg: 'bg-green-500/10',  color: 'text-green-400' },
    { key: 'ai',        label: 'AI Reports',         value: '—',               icon: Activity,     bg: 'bg-indigo-500/10', color: 'text-indigo-400' },
  ];

  if (loading) return <Spinner text="Loading dashboard…" />;

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf0]">Patient Dashboard</h1>
          <p className="text-sm text-[#8892a4] mt-1">Welcome back! Here&apos;s your health overview.</p>
        </div>
        <Link
          href="/patient/appointments"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <div key={s.key} className="flex items-start justify-between rounded-xl p-5 bg-[#0f1629] border border-[#1e2d4a]">
            <div>
              <p className="text-[#8892a4] text-sm font-medium">{s.label}</p>
              <p className="text-[#e8eaf0] text-3xl font-bold mt-1">{s.value}</p>
            </div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${s.bg} ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Appointments table */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#e8eaf0]">My Appointments</h2>
            <Link href="/patient/appointments" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#1e2d4a] bg-[#0f1629]">
            <table className="w-full text-left">
              <thead className="bg-[#141d35]">
                <tr>
                  {['#', 'Doctor', 'Date & Time', 'Reason', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[#8892a4] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {appointments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#8892a4] text-sm">No appointments yet. <Link href="/patient/appointments" className="text-blue-400">Book one!</Link></td></tr>
                ) : appointments.slice(0, 6).map((a) => (
                  <tr key={a.id} className="hover:bg-[#141d35] transition-colors">
                    <td className="px-4 py-3 text-xs text-[#8892a4] font-mono">#{a.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-[#e8eaf0]">{a.doctorId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-[#8892a4] whitespace-nowrap">{formatDateTime(a.appointmentDate)}</td>
                    <td className="px-4 py-3 text-sm text-[#8892a4] max-w-[120px] truncate">{a.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-[#e8eaf0] mb-4">Upcoming</h2>
          <div className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] divide-y divide-[#1e2d4a]">
            {upcoming.length === 0 ? (
              <p className="px-4 py-8 text-center text-[#8892a4] text-sm">No upcoming appointments</p>
            ) : upcoming.slice(0, 4).map((a) => (
              <div key={a.id} className="px-4 py-3 hover:bg-[#141d35] transition-colors">
                <p className="text-sm font-medium text-[#e8eaf0] truncate">{formatDateTime(a.appointmentDate)}</p>
                <p className="text-xs text-[#8892a4] mt-0.5">{a.reason || 'General Checkup'}</p>
                <Badge className={`mt-1.5 ${APPOINTMENT_STATUS_COLORS[a.status]}`}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Find Doctors */}
      <div>
        <h2 className="text-xl font-bold text-[#e8eaf0] mb-4">Available Doctors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {doctors.slice(0, 8).map((d) => (
            <div key={d.id} className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] p-5 flex flex-col items-center text-center hover:border-blue-500/30 transition-all duration-200 group cursor-pointer">
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold text-white">
                  {getInitials(d.name)}
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0f1629]" />
              </div>
              <p className="font-semibold text-[#e8eaf0] text-sm">{d.name}</p>
              <p className="text-xs text-[#8892a4] mb-2">{d.specialization}</p>
              <span className="text-xs text-[#8892a4]">{d.experience} yrs exp</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
