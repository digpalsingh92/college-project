'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileEdit, X, Check } from 'lucide-react';
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
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#e8eaf0]">My Schedule</h1>
        <p className="text-sm text-[#8892a4] mt-1">{appointments.length} total appointments</p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`h-9 px-4 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
              filterStatus === s ? 'bg-blue-600 text-white' : 'bg-[#0f1629] border border-[#1e2d4a] text-[#8892a4] hover:text-[#e8eaf0]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments table */}
        <div className="lg:col-span-2">
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
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[#8892a4] text-sm">No appointments found</td></tr>
                ) : filtered.map((a) => (
                  <tr key={a.id} className={`hover:bg-[#141d35] transition-colors ${selectedAppt?.id === a.id ? 'bg-blue-500/5' : ''}`}>
                    <td className="px-4 py-3 text-xs text-[#8892a4] font-mono">#{a.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-[#e8eaf0]">{a.patientId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-[#8892a4] whitespace-nowrap">{formatDateTime(a.appointmentDate)}</td>
                    <td className="px-4 py-3 text-sm text-[#8892a4] max-w-[120px] truncate">{a.reason || '—'}</td>
                    <td className="px-4 py-3"><Badge className={APPOINTMENT_STATUS_COLORS[a.status]}>{a.status}</Badge></td>
                    <td className="px-4 py-3">
                      {(a.status === 'pending' || a.status === 'confirmed') && (
                        <button
                          onClick={() => { setSelected(a); reset(); }}
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <FileEdit className="w-3.5 h-3.5" /> Add Notes
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes panel */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-[#e8eaf0] mb-4">
            {selectedAppt ? 'Add Clinical Notes' : 'Appointment Details'}
          </h2>

          {!selectedAppt ? (
            <div className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] p-6 text-center">
              <FileEdit className="w-8 h-8 text-[#8892a4] mx-auto mb-2" />
              <p className="text-sm text-[#8892a4]">Select an appointment to add notes and prescriptions</p>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-500/30 bg-[#0f1629] p-6 animate-fadein">
              <div className="mb-4 pb-4 border-b border-[#1e2d4a] space-y-1.5">
                <p className="text-xs text-[#8892a4]">Appointment <span className="font-mono text-[#e8eaf0]">#{selectedAppt.id.slice(0, 6).toUpperCase()}</span></p>
                <p className="text-xs text-[#8892a4]">Date: <span className="text-[#e8eaf0]">{formatDateTime(selectedAppt.appointmentDate)}</span></p>
                {selectedAppt.reason && <p className="text-xs text-[#8892a4]">Reason: <span className="text-[#e8eaf0]">{selectedAppt.reason}</span></p>}
                {selectedAppt.symptoms.length > 0 && <p className="text-xs text-[#8892a4]">Symptoms: <span className="text-[#e8eaf0]">{selectedAppt.symptoms.join(', ')}</span></p>}
              </div>

              <form onSubmit={handleSubmit(onSubmitNotes)} className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#8892a4]">Clinical Notes *</label>
                  <textarea
                    rows={4}
                    placeholder="Diagnosis, observations…"
                    className="bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm p-3 focus:outline-none focus:border-blue-500/60 placeholder:text-[#8892a4] resize-none"
                    {...register('doctorNotes')}
                  />
                  {errors.doctorNotes && <p className="text-xs text-red-400">{errors.doctorNotes.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#8892a4]">Prescriptions (comma separated)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paracetamol 500mg, Ibuprofen"
                    className="bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm p-3 focus:outline-none focus:border-blue-500/60 placeholder:text-[#8892a4] resize-none"
                    {...register('prescriptions')}
                  />
                </div>

                {formError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" loading={isSubmitting} className="flex-1">
                    <Check className="w-4 h-4" /> Complete
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(null)}>
                    <X className="w-4 h-4" />
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
