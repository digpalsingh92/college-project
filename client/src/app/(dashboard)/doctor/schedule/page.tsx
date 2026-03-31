'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileEdit, X, Check, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useAppointments } from '@/hooks/useAppointments';
import { Appointment } from '@/types';
import { formatDateTime, extractApiError } from '@/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/constants';

const notesSchema = z.object({
  doctorNotes:   z.string().min(1, 'Notes are required'),
  prescriptions: z.string().optional(),
});
type NotesForm = z.infer<typeof notesSchema>;

export default function DoctorSchedulePage() {
  const { appointments, loading, fetchDoctorAppointments, addDoctorNotes } = useAppointments();
  const [selectedAppt, setSelected] = useState<Appointment | null>(null);
  const [formError, setFormError]   = useState('');
  const [filterStatus, setFilter]   = useState('all');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NotesForm>({
    resolver: zodResolver(notesSchema),
  });

  useEffect(() => { fetchDoctorAppointments(); }, [fetchDoctorAppointments]);

  const filtered = appointments.filter((a) => filterStatus === 'all' || a.status === filterStatus);

  const onSubmitNotes = async (data: NotesForm) => {
    if (!selectedAppt) return;
    setFormError('');
    try {
      await addDoctorNotes(selectedAppt.id, {
        doctorNotes: data.doctorNotes,
        prescriptions: data.prescriptions ? data.prescriptions.split(',').map((p) => p.trim()) : [],
      });
      setSelected(null);
      reset();
    } catch (err) {
      setFormError(extractApiError(err));
    }
  };

  if (loading) return <Spinner text="Loading schedule…" />;

  return (
    <div className="animate-rise space-y-6">
      <section className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#8fb2db]">Schedule board</p>
        <h1 className="mt-2 text-3xl font-bold text-[#eaf1ff] sm:text-4xl">My Schedule</h1>
        <p className="mt-2 text-sm text-[#9ab2d7]">Review and update consultations with quick filters and a focused notes panel.</p>
        <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-[#2a3d62] bg-[#0d1730]/80 px-4 py-2.5">
          <ClipboardCheck className="h-4 w-4 text-[#78deda]" />
          <p className="text-sm text-[#eaf1ff]">{appointments.length} appointments in your timeline</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
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

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Appointments table */}
        <div className="xl:col-span-2">
          <div className="hidden overflow-x-auto rounded-2xl border border-[#2a3d62] bg-[#0d1730] md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#142443]">
                <tr>
                  {['#', 'Patient', 'Date & Time', 'Reason', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#89a3ce]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223963]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#9ab2d7]">No appointments found.</td></tr>
                ) : filtered.map((a) => (
                  <tr key={a.id} className={`transition-colors hover:bg-[#16284a] ${selectedAppt?.id === a.id ? 'bg-[#1f9d8f]/10' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-[#eaf1ff]">{a.patientId.slice(0, 8)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</td>
                    <td className="max-w-[120px] truncate px-4 py-3 text-[#9ab2d7]">{a.reason || 'N/A'}</td>
                    <td className="px-4 py-3"><Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge></td>
                    <td className="px-4 py-3">
                      {(a.status === 'pending' || a.status === 'confirmed') && (
                        <button
                          onClick={() => { setSelected(a); reset(); }}
                          className="inline-flex items-center gap-1 text-xs text-[#78deda] transition-colors hover:text-[#9ef7ee]"
                        >
                          <FileEdit className="h-3.5 w-3.5" /> Add Notes
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.length === 0 ? (
              <div className="surface-card p-5 text-center text-sm text-[#9ab2d7]">No appointments found.</div>
            ) : filtered.map((a) => (
              <div key={a.id} className={`surface-card space-y-2 p-4 ${selectedAppt?.id === a.id ? 'border-[#26c5b4]/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-[#89a3ce]">#{a.id.slice(0, 6).toUpperCase()}</p>
                  <Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge>
                </div>
                <p className="text-sm font-semibold text-[#eaf1ff]">Patient {a.patientId.slice(0, 8)}</p>
                <p className="text-xs text-[#9ab2d7]">{formatDateTime(a.appointmentDate)}</p>
                <p className="text-sm text-[#9ab2d7]">{a.reason || 'No specific reason provided.'}</p>
                {(a.status === 'pending' || a.status === 'confirmed') && (
                  <button
                    onClick={() => { setSelected(a); reset(); }}
                    className="inline-flex items-center gap-1 text-xs text-[#78deda] transition-colors hover:text-[#9ef7ee]"
                  >
                    <FileEdit className="h-3.5 w-3.5" /> Add Notes
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes panel */}
        <div className="xl:col-span-1">
          <h2 className="section-title mb-4">
            {selectedAppt ? 'Add Clinical Notes' : 'Appointment Details'}
          </h2>

          {!selectedAppt ? (
            <div className="surface-card p-6 text-center">
              <FileEdit className="mx-auto mb-2 h-8 w-8 text-[#94a7c8]" />
              <p className="text-sm text-[#9ab2d7]">Select an appointment to add notes and prescriptions.</p>
            </div>
          ) : (
            <div className="surface-card animate-fadein border-[#26c5b4]/40 p-6">
              <div className="mb-4 space-y-1.5 border-b border-[#25395f] pb-4">
                <p className="text-xs text-[#9ab2d7]">Appointment <span className="font-mono text-[#eaf1ff]">#{selectedAppt.id.slice(0, 6).toUpperCase()}</span></p>
                <p className="text-xs text-[#9ab2d7]">Date: <span className="text-[#eaf1ff]">{formatDateTime(selectedAppt.appointmentDate)}</span></p>
                {selectedAppt.reason && <p className="text-xs text-[#9ab2d7]">Reason: <span className="text-[#eaf1ff]">{selectedAppt.reason}</span></p>}
                {selectedAppt.symptoms.length > 0 && <p className="text-xs text-[#9ab2d7]">Symptoms: <span className="text-[#eaf1ff]">{selectedAppt.symptoms.join(', ')}</span></p>}
              </div>

              <form onSubmit={handleSubmit(onSubmitNotes)} className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#9db0cf]">Clinical Notes *</label>
                  <textarea
                    rows={4}
                    placeholder="Diagnosis, observations…"
                    className="resize-none rounded-xl border border-[#2a3d62] bg-[#0a1326] p-3 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25"
                    {...register('doctorNotes')}
                  />
                  {errors.doctorNotes && <p className="text-xs text-[#ffadad]">{errors.doctorNotes.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#9db0cf]">Prescriptions (comma separated)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paracetamol 500mg, Ibuprofen"
                    className="resize-none rounded-xl border border-[#2a3d62] bg-[#0a1326] p-3 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25"
                    {...register('prescriptions')}
                  />
                </div>

                {formError && <p className="rounded-lg border border-[#f56565]/30 bg-[#f56565]/10 px-3 py-2 text-sm text-[#ffadad]">{formError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" loading={isSubmitting} className="flex-1">
                    <Check className="h-4 w-4" /> Complete
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
