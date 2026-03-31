'use client';
import { useEffect, useState } from 'react';
import { Search, Users, CalendarFold, Stethoscope } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { doctorApi } from '@/lib/api';
import { Appointment } from '@/types';
import { formatDateTime } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';
import { Badge } from '@/components/ui/Badge';

export default function DoctorPatientsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    doctorApi.getAppointments().then((r) => {
      setAppointments(r.data.appointments ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Group by unique patient
  const patientMap = appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    if (!acc[a.patientId]) acc[a.patientId] = [];
    acc[a.patientId].push(a);
    return acc;
  }, {});

  const filtered = Object.entries(patientMap).filter(([pid]) =>
    search === '' || pid.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner text="Loading patients…" />;

  const totalPatients = Object.keys(patientMap).length;
  const totalAppointments = appointments.length;
  const pending = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;

  return (
    <div className="animate-rise space-y-6">
      <section className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#8fb2db]">Patient tracking</p>
        <h1 className="mt-2 text-3xl font-bold text-[#eaf1ff] sm:text-4xl">My Patients</h1>
        <p className="mt-2 text-sm text-[#9ab2d7]">Search your patient pool and quickly review appointment history and current status trends.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wider text-[#8ea5cb]">Patients</p>
            <div className="mt-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#78deda]" />
              <p className="text-2xl font-bold text-[#eaf1ff]">{totalPatients}</p>
            </div>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wider text-[#8ea5cb]">Appointments</p>
            <div className="mt-2 flex items-center gap-2">
              <CalendarFold className="h-4 w-4 text-[#80d7ff]" />
              <p className="text-2xl font-bold text-[#eaf1ff]">{totalAppointments}</p>
            </div>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wider text-[#8ea5cb]">Open Cases</p>
            <div className="mt-2 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-amber-300" />
              <p className="text-2xl font-bold text-[#eaf1ff]">{pending}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a7c8]" />
        <input
          placeholder="Search by patient ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-[#2a3d62] bg-[#0a1326] pl-9 pr-4 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-[#9ab2d7]">No patients found with that keyword.</div>
        ) : filtered.map(([patientId, appts]) => {
          const latest = appts.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())[0];
          return (
            <div key={patientId} className="surface-card p-5 transition-all duration-200 hover:border-[#26c5b4]/40 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#1f83c2] to-[#1f9d8f] text-sm font-bold text-white">
                  {patientId[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-mono text-sm font-semibold text-[#eaf1ff]">{patientId.slice(0, 12)}</p>
                  <p className="text-xs text-[#94a7c8]">{appts.length} appointment{appts.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#9ab2d7]">
                  <span>Last visit</span>
                  <span className="text-[#eaf1ff]">{formatDateTime(latest.appointmentDate)}</span>
                </div>
                <div className="flex justify-between text-[#9ab2d7]">
                  <span>Last status</span>
                  <Badge className={APPOINTMENT_STATUS_COLORS[latest.status]}>{latest.status}</Badge>
                </div>
                {latest.symptoms.length > 0 && (
                  <div className="flex justify-between text-[#9ab2d7]">
                    <span>Symptoms</span>
                    <span className="max-w-[120px] truncate text-[#eaf1ff]">{latest.symptoms.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
