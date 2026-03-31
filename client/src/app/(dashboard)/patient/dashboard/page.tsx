'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, CheckCircle2, Activity, ArrowUpRight, Plus, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { patientApi, doctorApi } from '@/lib/api';
import { Appointment, Doctor } from '@/types';
import { formatDateTime, getInitials } from '@/utils';
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
    { key: 'total',     label: 'Total Appointments', value: appointments.length, icon: Calendar,     bg: 'bg-[#1f83c2]/15', color: 'text-[#80d7ff]' },
    { key: 'upcoming',  label: 'Upcoming',           value: upcoming.length,    icon: Clock,        bg: 'bg-amber-500/15', color: 'text-amber-300' },
    { key: 'completed', label: 'Completed',          value: completed,          icon: CheckCircle2, bg: 'bg-emerald-500/15', color: 'text-emerald-300' },
    { key: 'ai',        label: 'AI Reports',         value: cancelled,          icon: Activity,     bg: 'bg-indigo-500/15', color: 'text-indigo-300' },
  ];

  if (loading) return <Spinner text="Loading dashboard…" />;

  return (
    <div className="animate-rise space-y-8">
      <section className="mesh-bg overflow-hidden rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[#8fb2db]">Patient dashboard</p>
            <h1 className="text-3xl font-bold text-[#eaf1ff] sm:text-4xl">Your Health Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#9ab2d7] sm:text-base">View upcoming appointments, book quickly, and stay informed with AI-assisted insights.</p>
          </div>
          <div className="surface-card flex items-center gap-3 px-4 py-3">
            <div className="rounded-xl bg-[#1f9d8f]/15 p-2.5">
              <Sparkles className="h-4 w-4 text-[#6fe9db]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8fb2db]">Next steps</p>
              <p className="text-sm font-semibold text-[#eaf1ff]">{upcoming.length} active bookings</p>
            </div>
          </div>
        </div>
        <Link
          href="/patient/appointments"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f9d8f] to-[#1f83c2] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1f83c2]/25 transition-all duration-200 hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Book Appointment
        </Link>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.key} className="surface-card flex items-start justify-between p-5">
            <div>
              <p className="text-sm font-medium text-[#8ea5cb]">{s.label}</p>
              <p className="mt-1 text-3xl font-bold text-[#eaf1ff]">{s.value}</p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.bg} ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Appointments table */}
        <div className="xl:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">My Appointments</h2>
            <Link href="/patient/appointments" className="inline-flex items-center gap-1 text-sm font-medium text-[#78deda] hover:text-[#9ef7ee]">
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-[#2a3d62] bg-[#0d1730] md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#142443]">
                <tr>
                  {['#', 'Doctor', 'Date & Time', 'Reason', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#89a3ce]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223963]">
                {appointments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#90a8ce]">No appointments yet. <Link href="/patient/appointments" className="text-[#78deda]">Book one.</Link></td></tr>
                ) : appointments.slice(0, 6).map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-[#16284a]">
                    <td className="px-4 py-3 font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-[#eaf1ff]">{a.doctorId.slice(0, 8)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</td>
                    <td className="max-w-[120px] truncate px-4 py-3 text-[#9ab2d7]">{a.reason || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {appointments.length === 0 ? (
              <div className="surface-card p-4 text-center text-sm text-[#90a8ce]">No appointments yet.</div>
            ) : appointments.slice(0, 6).map((a) => (
              <div key={a.id} className="surface-card space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</p>
                  <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
                </div>
                <p className="text-sm font-semibold text-[#eaf1ff]">Doctor {a.doctorId.slice(0, 8)}</p>
                <p className="text-xs text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</p>
                <p className="text-sm text-[#9ab2d7]">{a.reason || 'No reason provided.'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className="xl:col-span-1">
          <h2 className="section-title mb-4">Upcoming</h2>
          <div className="overflow-hidden rounded-2xl border border-[#2a3d62] bg-[#0d1730] divide-y divide-[#223963]">
            {upcoming.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#90a8ce]">No upcoming appointments</p>
            ) : upcoming.slice(0, 4).map((a) => (
              <div key={a.id} className="px-4 py-3 transition-colors hover:bg-[#16284a]">
                <p className="truncate text-sm font-medium text-[#eaf1ff]">{formatDateTime(a.appointmentDate)}</p>
                <p className="mt-0.5 text-xs text-[#9ab2d7]">{a.reason || 'General checkup'}</p>
                <Badge className={`mt-1.5 ${APPOINTMENT_STATUS_COLORS[a.status]}`}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Find Doctors */}
      <div>
        <h2 className="section-title mb-4">Available Doctors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {doctors.slice(0, 8).map((d) => (
            <div key={d.id} className="surface-card group flex cursor-pointer flex-col items-center p-5 text-center transition-all duration-200 hover:border-[#26c5b4]/40 hover:-translate-y-0.5">
              <div className="relative mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1f83c2] to-[#1f9d8f] text-lg font-bold text-white">
                  {getInitials(d.name)}
                </div>
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0f1a30] bg-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-[#eaf1ff]">{d.name}</p>
              <p className="mb-2 text-xs text-[#94a7c8]">{d.specialization}</p>
              <span className="text-xs text-[#9ab2d7]">{d.experience} yrs exp</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
