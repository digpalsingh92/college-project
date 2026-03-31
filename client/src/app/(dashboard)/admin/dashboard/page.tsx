'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, CheckCircle2, Users, Check, X, ArrowUpRight, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, StatSkeletonGrid } from '@/components/ui/Skeleton';
import { adminApi } from '@/lib/api';
import { Appointment, Doctor, Patient } from '@/types';
import { formatDateTime, getInitials } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';

const statIcons: Record<string, { icon: typeof Calendar; bg: string; color: string }> = {
  appointments: { icon: Calendar,      bg: 'bg-[#1f83c2]/15', color: 'text-[#80d7ff]' },
  pending:      { icon: Clock,         bg: 'bg-amber-500/15', color: 'text-amber-300' },
  doctors:      { icon: Users,         bg: 'bg-emerald-500/15', color: 'text-emerald-300' },
  completed:    { icon: CheckCircle2,  bg: 'bg-indigo-500/15', color: 'text-indigo-300' },
};

export default function AdminDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardRes, doctorsRes, patientsRes] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getDoctors(),
          adminApi.getPatients(),
        ]);

        const dashboard = dashboardRes.data;
        setAppointments((dashboard?.appointments ?? dashboard?.recentAppointments ?? []) as Appointment[]);
        setDoctors((doctorsRes.data?.doctors ?? []) as Doctor[]);
        setPatients((patientsRes.data?.patients ?? []) as Patient[]);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-3 h-10 w-64" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        </div>
        <StatSkeletonGrid />
        <div className="surface-card rounded-2xl p-5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-4 h-56 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-8">
      <section className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fb2db]">Administration hub</p>
            <h1 className="mt-2 text-3xl font-bold text-[#eaf1ff] sm:text-4xl">Platform Operations</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#9ab2d7] sm:text-base">Supervise appointments, user activity, and care-team readiness with a single real-time command surface.</p>
          </div>
          <div className="surface-card flex items-center gap-3 px-4 py-3">
            <div className="rounded-xl bg-[#1f9d8f]/15 p-2.5">
              <ShieldCheck className="h-4 w-4 text-[#6fe9db]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8fb2db]">System users</p>
              <p className="text-sm font-semibold text-[#eaf1ff]">{patients.length + doctors.length} active records</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const { icon: Icon, bg, color } = statIcons[s.key];
          return (
            <div key={s.key} className="surface-card flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-[#8ea5cb]">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-[#eaf1ff]">{s.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bg} ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </section>

      {/* Main grid — 2/3 table + 1/3 pending panel */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Appointments table */}
        <div className="xl:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">Recent Appointments</h2>
            <Link href="/admin/appointments" className="inline-flex items-center gap-1 text-sm font-medium text-[#78deda] transition-colors hover:text-[#9ef7ee]">
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-[#2a3d62] bg-[#0d1730] md:block">
            <table className="w-full text-left">
              <thead className="bg-[#142443]">
                <tr>
                  {['ID', 'Patient', 'Doctor', 'Date & Time', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#89a3ce]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223963]">
                {appointments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#90a8ce]">No appointments yet.</td></tr>
                ) : appointments.slice(0, 6).map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-[#16284a]">
                    <td className="px-4 py-3 font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-[#eaf1ff]">{a.patientId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-[#9ab2d7]">{a.doctorId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</td>
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
              <EmptyState
                title="No appointments yet"
                description="Appointment activity will appear here once patients start booking slots."
                icon={Calendar}
              />
            ) : appointments.slice(0, 6).map((a) => (
              <div key={a.id} className="surface-card space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</p>
                  <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
                </div>
                <p className="text-sm font-semibold text-[#eaf1ff]">Patient {a.patientId.slice(0, 8)}</p>
                <p className="text-xs text-[#9ab2d7]">Doctor {a.doctorId.slice(0, 8)}</p>
                <p className="text-xs text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals panel */}
        <div className="xl:col-span-1">
          <h2 className="section-title mb-4">Pending Approvals</h2>
          <div className="overflow-hidden rounded-2xl border border-[#2a3d62] bg-[#0d1730]">
            {pending.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#9ab2d7]">No pending approvals.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#142443]">
                  <tr>
                    {['Patient', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#89a3ce]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#223963]">
                  {pending.slice(0, 5).map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-[#16284a]">
                      <td className="px-3 py-2.5 text-sm text-[#eaf1ff]">{a.patientId.slice(0, 8)}</td>
                      <td className="px-3 py-2.5 text-xs text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <button aria-label="Approve appointment" title="Approve appointment" className="rounded-lg bg-emerald-500/20 p-1 text-emerald-300 transition-colors hover:bg-emerald-500/40"><Check className="h-3.5 w-3.5" /></button>
                          <button aria-label="Reject appointment" title="Reject appointment" className="rounded-lg bg-red-500/20 p-1 text-[#ffb3b3] transition-colors hover:bg-red-500/40"><X className="h-3.5 w-3.5" /></button>
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Active Doctors</h2>
          <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-medium text-[#78deda] transition-colors hover:text-[#9ef7ee]">
            Manage admins <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {doctors.length === 0 ? (
            <EmptyState
              title="No doctors found"
              description="Add and verify doctors to activate care workflows across the platform."
              icon={UserRoundPlus}
              className="md:col-span-2 lg:col-span-4"
            />
          ) : doctors.slice(0, 8).map((d) => (
            <div key={d.id} className="surface-card flex flex-col items-center p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#26c5b4]/40">
              <div className="relative mb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1f83c2] to-[#1f9d8f] text-xl font-bold text-white">
                  {getInitials(d.name)}
                </div>
                <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#0f1a30] ${d.isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </div>
              <p className="text-sm font-semibold text-[#eaf1ff]">{d.name}</p>
              <p className="mb-2 text-xs text-[#94a7c8]">{d.specialization}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                d.isVerified ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
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
