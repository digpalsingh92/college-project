'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, CheckCircle2, Clock, ArrowUpRight, FileEdit } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { doctorApi } from '@/lib/api';
import { Appointment } from '@/types';
import { formatDateTime, extractApiError } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await doctorApi.getAppointments();
        setAppointments(res.data.appointments ?? []);
      } catch {/* ignore */}
      setLoading(false);
    };
    load();
  }, []);

  const upcoming  = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed');
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const patients  = new Set(appointments.map((a) => a.patientId)).size;

  const stats = [
    { label: 'Total Appointments', value: appointments.length, icon: Calendar,     bg: 'bg-blue-500/10',   color: 'text-blue-400' },
    { label: 'Upcoming',           value: upcoming.length,    icon: Clock,        bg: 'bg-yellow-500/10', color: 'text-yellow-400' },
    { label: 'Completed',          value: completed,          icon: CheckCircle2, bg: 'bg-green-500/10',  color: 'text-green-400' },
    { label: 'Unique Patients',    value: patients,           icon: Users,        bg: 'bg-purple-500/10', color: 'text-purple-400' },
  ];

  if (loading) return <Spinner text="Loading dashboard…" />;

  return (
    <div className="animate-fadein">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf0]">Doctor Dashboard</h1>
          <p className="text-sm text-[#8892a4] mt-1">Your appointments and patient overview</p>
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="flex items-start justify-between rounded-xl p-5 bg-[#0f1629] border border-[#1e2d4a]">
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
            <h2 className="text-xl font-bold text-[#e8eaf0]">Today&apos;s Appointments</h2>
            <Link href="/doctor/schedule" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium">
              Full Schedule <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#1e2d4a] bg-[#0f1629]">
            <table className="w-full text-left">
              <thead className="bg-[#141d35]">
                <tr>
                  {['#', 'Patient', 'Date & Time', 'Reason', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[#8892a4] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {appointments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#8892a4] text-sm">No appointments yet</td></tr>
                ) : appointments.slice(0, 6).map((a) => (
                  <tr key={a.id} className="hover:bg-[#141d35] transition-colors">
                    <td className="px-4 py-3 text-xs text-[#8892a4] font-mono">#{a.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-[#e8eaf0]">{a.patientId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-[#8892a4] whitespace-nowrap">{formatDateTime(a.appointmentDate)}</td>
                    <td className="px-4 py-3 text-sm text-[#8892a4] max-w-[100px] truncate">{a.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {a.status !== 'completed' && a.status !== 'cancelled' && (
                        <Link href="/doctor/schedule" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                          <FileEdit className="w-3.5 h-3.5" /> Notes
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming panel */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-[#e8eaf0] mb-4">Upcoming</h2>
          <div className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] divide-y divide-[#1e2d4a]">
            {upcoming.length === 0 ? (
              <p className="px-4 py-8 text-center text-[#8892a4] text-sm">No upcoming appointments</p>
            ) : upcoming.slice(0, 5).map((a) => (
              <div key={a.id} className="px-4 py-3 hover:bg-[#141d35] transition-colors">
                <p className="text-sm font-medium text-[#e8eaf0]">{formatDateTime(a.appointmentDate)}</p>
                <p className="text-xs text-[#8892a4] mt-0.5">Patient: {a.patientId.slice(0, 8)}</p>
                {a.symptoms.length > 0 && (
                  <p className="text-xs text-[#8892a4] mt-0.5">Symptoms: {a.symptoms.slice(0, 2).join(', ')}</p>
                )}
                <Badge className={`mt-1.5 ${APPOINTMENT_STATUS_COLORS[a.status]}`}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
