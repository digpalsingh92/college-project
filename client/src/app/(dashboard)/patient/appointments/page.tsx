'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Calendar, Trash2, Search, Clock3 } from 'lucide-react';
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
    <div className="animate-rise space-y-6">
      <section className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fb2db]">Appointment center</p>
            <h1 className="mt-2 text-3xl font-bold text-[#eaf1ff] sm:text-4xl">My Appointments</h1>
            <p className="mt-2 text-sm text-[#9ab2d7]">Book, review, and manage upcoming consultations from one responsive control panel.</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2a3d62] bg-[#0d1730]/80 px-3 py-1.5">
              <Clock3 className="h-4 w-4 text-[#78deda]" />
              <span className="text-xs font-medium text-[#eaf1ff]">{appointments.length} appointments total</span>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close form' : 'Book Appointment'}
          </Button>
        </div>
      </section>

      {showForm && (
        <div className="surface-card animate-fadein border-[#26c5b4]/40 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#eaf1ff]">
            <Calendar className="h-5 w-5 text-[#78deda]" /> Book New Appointment
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#9db0cf]">Doctor *</label>
              <select className="h-11 rounded-xl border border-[#2a3d62] bg-[#0a1326] px-4 text-sm text-[#eaf1ff] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25" {...register('doctorId')}>
                <option value="">Select a doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} - {d.specialization}</option>
                ))}
              </select>
              {errors.doctorId && <p className="text-xs text-[#ffadad]">{errors.doctorId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#9db0cf]">Date & Time *</label>
              <input type="datetime-local" className="h-11 rounded-xl border border-[#2a3d62] bg-[#0a1326] px-4 text-sm text-[#eaf1ff] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25" {...register('appointmentDate')} />
              {errors.appointmentDate && <p className="text-xs text-[#ffadad]">{errors.appointmentDate.message}</p>}
            </div>

            <Input label="Reason" placeholder="e.g. Routine checkup" {...register('reason')} />
            <Input label="Symptoms (comma separated)" placeholder="e.g. fever, headache" {...register('symptoms')} />
            <Input label="Duration (minutes)" type="number" placeholder="30" {...register('duration')} />

            {formError && <p className="rounded-lg border border-[#f56565]/30 bg-[#f56565]/10 px-3 py-2 text-sm text-[#ffadad] md:col-span-2">{formError}</p>}
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button type="submit" loading={isSubmitting}>Confirm booking</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a7c8]" />
          <input
            placeholder="Search by doctor or reason"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#2a3d62] bg-[#0a1326] pl-9 pr-4 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25"
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
        <table className="w-full text-left text-sm">
          <thead className="bg-[#142443]">
            <tr>
              {['#', 'Doctor', 'Date & Time', 'Reason', 'Symptoms', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#89a3ce]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#223963]">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[#90a8ce]">No appointments found.</td></tr>
            ) : filtered.map((a) => {
              const doctor = doctors.find((d) => d.id === a.doctorId);
              return (
                <tr key={a.id} className="transition-colors hover:bg-[#16284a]">
                  <td className="px-4 py-3 font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-[#eaf1ff]">{doctor ? `${doctor.name}` : a.doctorId.slice(0, 8)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</td>
                  <td className="max-w-[120px] truncate px-4 py-3 text-[#9ab2d7]">{a.reason || 'N/A'}</td>
                  <td className="max-w-[120px] truncate px-4 py-3 text-[#9ab2d7]">{a.symptoms.slice(0, 2).join(', ') || 'N/A'}</td>
                  <td className="px-4 py-3"><Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge></td>
                  <td className="px-4 py-3">
                    {(a.status === 'pending' || a.status === 'confirmed') && (
                      <button onClick={() => handleCancel(a.id)} className="inline-flex items-center gap-1 text-xs text-[#ffadad] transition-colors hover:text-[#ffd2d2]">
                        <Trash2 className="h-3.5 w-3.5" /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="surface-card p-4 text-center text-sm text-[#90a8ce]">No appointments found.</div>
        ) : filtered.map((a) => {
          const doctor = doctors.find((d) => d.id === a.doctorId);
          return (
            <div key={a.id} className="surface-card space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</p>
                <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
              </div>
              <p className="text-sm font-semibold text-[#eaf1ff]">{doctor?.name || `Doctor ${a.doctorId.slice(0, 8)}`}</p>
              <p className="text-xs text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</p>
              <p className="text-sm text-[#9ab2d7]">{a.reason || 'No reason provided.'}</p>
              {(a.status === 'pending' || a.status === 'confirmed') && (
                <button onClick={() => handleCancel(a.id)} className="inline-flex items-center gap-1 text-xs text-[#ffadad] transition-colors hover:text-[#ffd2d2]">
                  <Trash2 className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
