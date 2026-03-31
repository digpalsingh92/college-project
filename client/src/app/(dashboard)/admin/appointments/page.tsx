'use client';
import { useEffect, useState } from 'react';
import { Search, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { adminApi } from '@/lib/api';
import { Appointment } from '@/types';
import { formatDateTime } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilter]       = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const direct = await adminApi.getAppointments();
        setAppointments((direct.data?.appointments ?? []) as Appointment[]);
      } catch {
        try {
          const dashboard = await adminApi.getDashboard();
          setAppointments((dashboard.data?.appointments ?? dashboard.data?.recentAppointments ?? []) as Appointment[]);
        } catch {
          setAppointments([]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = appointments
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .filter((a) => search === '' ||
      a.patientId.includes(search) ||
      a.doctorId.includes(search) ||
      a.reason?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="mt-3 h-10 w-72" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <div className="surface-card rounded-2xl p-5">
          <Skeleton className="h-11 w-full max-w-md" />
          <Skeleton className="mt-4 h-56 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <section className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fb2db]">Scheduling oversight</p>
            <h1 className="mt-2 text-3xl font-bold text-[#eaf1ff] sm:text-4xl">All Appointments</h1>
            <p className="mt-2 text-sm text-[#9ab2d7]">Track appointment velocity, audit status transitions, and spot operational bottlenecks early.</p>
          </div>
          <div className="surface-card flex items-center gap-3 px-4 py-3">
            <div className="rounded-xl bg-[#1f83c2]/15 p-2.5">
              <CalendarClock className="h-4 w-4 text-[#80d7ff]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8fb2db]">Total records</p>
              <p className="text-sm font-semibold text-[#eaf1ff]">{appointments.length} appointments</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a7c8]" />
          <input
            placeholder="Search patient, doctor, reason"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl border border-[#2a3d62] bg-[#0a1326] pl-9 pr-4 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25"
          />
        </div>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`pill-filter capitalize ${filterStatus === s ? 'active' : ''}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-[#2a3d62] bg-[#0d1730] md:block">
        <table className="w-full text-left">
          <thead className="bg-[#142443]">
            <tr>
              {['#', 'Patient', 'Doctor', 'Date & Time', 'Reason', 'Symptoms', 'Duration', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#89a3ce]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#223963]">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[#9ab2d7]">No appointments found.</td></tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-[#16284a]">
                <td className="px-4 py-3 font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</td>
                <td className="px-4 py-3 font-mono text-sm text-[#eaf1ff]">{a.patientId.slice(0, 8)}</td>
                <td className="px-4 py-3 font-mono text-sm text-[#9ab2d7]">{a.doctorId.slice(0, 8)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</td>
                <td className="max-w-[100px] truncate px-4 py-3 text-sm text-[#9ab2d7]">{a.reason || 'N/A'}</td>
                <td className="max-w-[100px] truncate px-4 py-3 text-sm text-[#9ab2d7]">{a.symptoms.slice(0, 2).join(', ') || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-[#9ab2d7]">{a.duration}m</td>
                <td className="px-4 py-3"><Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No appointments found"
            description="Adjust your filters or search query to find matching appointment records."
            icon={CalendarClock}
          />
        ) : filtered.map((a) => (
          <div key={a.id} className="surface-card space-y-2 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</p>
              <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
            </div>
            <p className="text-sm font-semibold text-[#eaf1ff]">Patient {a.patientId.slice(0, 8)}</p>
            <p className="text-xs text-[#9ab2d7]">Doctor {a.doctorId.slice(0, 8)}</p>
            <p className="text-xs text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</p>
            <p className="text-sm text-[#9ab2d7]">{a.reason || 'No reason provided.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
