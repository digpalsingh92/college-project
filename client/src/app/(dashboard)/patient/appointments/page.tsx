'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Calendar, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useAppointments } from '@/hooks/useAppointments';
import { doctorApi } from '@/lib/api';
import { Doctor } from '@/types';
import { formatDateTime, extractApiError } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';

const schema = z.object({
  doctorId: z.string().min(1, 'Select a doctor'),
  appointmentDate: z.string().min(1, 'Select a date'),
  reason: z.string().optional(),
  symptoms: z.string().optional(),
  duration: z.coerce.number().optional(),
});
type FormData = z.infer<typeof schema>;
type RawFormData = z.input<typeof schema>;

export default function PatientAppointmentsPage() {
  const { appointments, loading, fetchPatientAppointments, createAppointment, cancelAppointment } = useAppointments();
  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RawFormData, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetchPatientAppointments();
    doctorApi.getAll().then((r) => setDoctors(r.data.doctors ?? [])).catch(() => {});
  }, [fetchPatientAppointments]);

  const onSubmit = async (data: FormData) => {
    setFormError('');
    try {
      await createAppointment({
        ...data,
        symptoms: data.symptoms ? data.symptoms.split(',').map((s) => s.trim()) : [],
        duration: data.duration || 30,
      });
      await fetchPatientAppointments();
      reset();
      setShowForm(false);
    } catch (err) {
      setFormError(extractApiError(err));
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try { await cancelAppointment(id); } catch {/* ignore */}
  };

  const filtered = appointments
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .filter((a) => search === '' || a.doctorId.includes(search) || a.reason?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Spinner text="Loading appointments…" />;

  return (
    <div className="animate-fadein">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf0]">My Appointments</h1>
          <p className="text-sm text-[#8892a4] mt-1">{appointments.length} total appointments</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Book Appointment'}
        </Button>
      </div>

      {/* Book Form */}
      {showForm && (
        <div className="rounded-xl border border-blue-500/30 bg-[#0f1629] p-6 mb-6 animate-fadein">
          <h2 className="text-lg font-bold text-[#e8eaf0] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Book New Appointment
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8892a4]">Doctor *</label>
              <select className="h-11 bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm px-4 focus:outline-none focus:border-blue-500/60" {...register('doctorId')}>
                <option value="">Select a doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                ))}
              </select>
              {errors.doctorId && <p className="text-xs text-red-400">{errors.doctorId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8892a4]">Date & Time *</label>
              <input type="datetime-local" className="h-11 bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm px-4 focus:outline-none focus:border-blue-500/60" {...register('appointmentDate')} />
              {errors.appointmentDate && <p className="text-xs text-red-400">{errors.appointmentDate.message}</p>}
            </div>

            <Input label="Reason" placeholder="e.g. Routine checkup" {...register('reason')} />
            <Input label="Symptoms (comma separated)" placeholder="e.g. fever, headache" {...register('symptoms')} />
            <Input label="Duration (minutes)" type="number" placeholder="30" {...register('duration')} />

            {formError && <p className="md:col-span-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>}
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" loading={isSubmitting}>Confirm Booking</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
          <input
            placeholder="Search by doctor or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 bg-[#0f1629] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm placeholder:text-[#8892a4] focus:outline-none focus:border-blue-500/60"
          />
        </div>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
              filterStatus === s ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-[#1e2d4a] text-[#8892a4] hover:text-[#e8eaf0]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1e2d4a] bg-[#0f1629]">
        <table className="w-full text-left">
          <thead className="bg-[#141d35]">
            <tr>
              {['#', 'Doctor', 'Date & Time', 'Reason', 'Symptoms', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-[#8892a4] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2d4a]">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#8892a4] text-sm">No appointments found</td></tr>
            ) : filtered.map((a) => {
              const doctor = doctors.find((d) => d.id === a.doctorId);
              return (
                <tr key={a.id} className="hover:bg-[#141d35] transition-colors">
                  <td className="px-4 py-3 text-xs text-[#8892a4] font-mono">#{a.id.slice(0, 6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm text-[#e8eaf0]">{doctor ? `${doctor.name}` : a.doctorId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-[#8892a4] whitespace-nowrap">{formatDateTime(a.appointmentDate)}</td>
                  <td className="px-4 py-3 text-sm text-[#8892a4] max-w-[120px] truncate">{a.reason || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#8892a4] max-w-[120px] truncate">{a.symptoms.slice(0, 2).join(', ') || '—'}</td>
                  <td className="px-4 py-3"><Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge></td>
                  <td className="px-4 py-3">
                    {(a.status === 'pending' || a.status === 'confirmed') && (
                      <button onClick={() => handleCancel(a.id)} className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
