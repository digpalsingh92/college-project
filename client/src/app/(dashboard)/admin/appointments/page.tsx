'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { doctorApi } from '@/lib/api';
import { Appointment } from '@/types';
import { formatDateTime } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilter]       = useState('all');

  useEffect(() => {
    doctorApi.getAppointments().then((r) => setAppointments(r.data.appointments ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = appointments
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .filter((a) => search === '' ||
      a.patientId.includes(search) ||
      a.doctorId.includes(search) ||
      a.reason?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return <Spinner text="Loading appointments…" />;

  return (
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#e8eaf0]">All Appointments</h1>
        <p className="text-sm text-[#8892a4] mt-1">{appointments.length} total appointments in the system</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
          <input
            placeholder="Search patient, doctor, reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 bg-[#0f1629] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm placeholder:text-[#8892a4] focus:outline-none focus:border-blue-500/60"
          />
        </div>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`h-10 px-4 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
              filterStatus === s ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-[#1e2d4a] text-[#8892a4] hover:text-[#e8eaf0]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1e2d4a] bg-[#0f1629]">
        <table className="w-full text-left">
          <thead className="bg-[#141d35]">
            <tr>
              {['#', 'Patient', 'Doctor', 'Date & Time', 'Reason', 'Symptoms', 'Duration', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-[#8892a4] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2d4a]">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[#8892a4] text-sm">No appointments found</td></tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="hover:bg-[#141d35] transition-colors">
                <td className="px-4 py-3 text-xs text-[#8892a4] font-mono">#{a.id.slice(0, 6).toUpperCase()}</td>
                <td className="px-4 py-3 text-sm text-[#e8eaf0] font-mono">{a.patientId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-sm text-[#8892a4] font-mono">{a.doctorId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-sm text-[#8892a4] whitespace-nowrap">{formatDateTime(a.appointmentDate)}</td>
                <td className="px-4 py-3 text-sm text-[#8892a4] max-w-[100px] truncate">{a.reason || '—'}</td>
                <td className="px-4 py-3 text-sm text-[#8892a4] max-w-[100px] truncate">{a.symptoms.slice(0, 2).join(', ') || '—'}</td>
                <td className="px-4 py-3 text-sm text-[#8892a4]">{a.duration}m</td>
                <td className="px-4 py-3"><Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
