'use client';
import { useEffect, useState } from 'react';
import { Search, User } from 'lucide-react';
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

  return (
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#e8eaf0]">My Patients</h1>
        <p className="text-sm text-[#8892a4] mt-1">{Object.keys(patientMap).length} unique patients</p>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
        <input
          placeholder="Search by patient ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full pl-9 pr-4 bg-[#0f1629] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm placeholder:text-[#8892a4] focus:outline-none focus:border-blue-500/60"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <p className="text-[#8892a4] text-sm">No patients found.</p>
        ) : filtered.map(([patientId, appts]) => {
          const latest = appts.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())[0];
          return (
            <div key={patientId} className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] p-5 hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                  {patientId[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#e8eaf0] font-mono">{patientId.slice(0, 12)}</p>
                  <p className="text-xs text-[#8892a4]">{appts.length} appointment{appts.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#8892a4]">
                  <span>Last visit</span>
                  <span className="text-[#e8eaf0]">{formatDateTime(latest.appointmentDate)}</span>
                </div>
                <div className="flex justify-between text-[#8892a4]">
                  <span>Last status</span>
                  <Badge className={APPOINTMENT_STATUS_COLORS[latest.status]}>{latest.status}</Badge>
                </div>
                {latest.symptoms.length > 0 && (
                  <div className="flex justify-between text-[#8892a4]">
                    <span>Symptoms</span>
                    <span className="text-[#e8eaf0] truncate max-w-[120px]">{latest.symptoms.slice(0, 2).join(', ')}</span>
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
