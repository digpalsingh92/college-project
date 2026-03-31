'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Zap, Activity, Send, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { aiApi } from '@/lib/api';
import { PredictResult } from '@/types';
import { RESOURCE_LOAD_COLORS } from '@/constants';
import { extractApiError } from '@/utils';

const predictSchema = z.object({
  patients_waiting:    z.coerce.number().min(0),
  avg_consult_minutes: z.coerce.number().min(1),
  doctors_available:   z.coerce.number().min(1),
  age:                 z.coerce.number().min(1).max(120).optional(),
  appointment_hour:    z.coerce.number().min(0).max(23).optional(),
});
type PredictForm = z.infer<typeof predictSchema>;
type RawPredictForm = z.input<typeof predictSchema>;

const symptomSchema = z.object({ symptoms: z.string().min(2) });
type SymptomForm = z.infer<typeof symptomSchema>;

export default function PatientReportsPage() {
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);
  const [symptomResult, setSymptomResult] = useState<Record<string, unknown> | null>(null);
  const [predictError, setPredictError]   = useState('');
  const [symptomError, setSymptomError]   = useState('');

  const pForm = useForm<RawPredictForm, unknown, PredictForm>({ resolver: zodResolver(predictSchema) });
  const sForm = useForm<SymptomForm>({ resolver: zodResolver(symptomSchema) });

  const onPredict = async (data: PredictForm) => {
    setPredictError(''); setPredictResult(null);
    try {
      const res = await aiApi.predict(data);
      setPredictResult(res.data);
    } catch (err) { setPredictError(extractApiError(err)); }
  };

  const onSymptom = async (data: SymptomForm) => {
    setSymptomError(''); setSymptomResult(null);
    const symptoms = data.symptoms.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const res = await aiApi.symptomCheck({ symptoms });
      setSymptomResult(res.data);
    } catch (err) { setSymptomError(extractApiError(err)); }
  };

  const loadColor = predictResult ? RESOURCE_LOAD_COLORS[predictResult['Resource Load']] ?? 'text-[#e8eaf0]' : '';

  return (
    <div className="animate-rise space-y-6">
      <section className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#8fb2db]">AI diagnostics</p>
        <h1 className="mt-2 text-3xl font-bold text-[#eaf1ff] sm:text-4xl">AI Health Reports</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9ab2d7] sm:text-base">Use model-powered checks to estimate waiting pressure and get fast symptom triage support before you visit.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2a3d62] bg-[#0d1730]/80 px-3 py-1.5">
          <FlaskConical className="h-4 w-4 text-[#78deda]" />
          <span className="text-xs font-medium text-[#eaf1ff]">Two quick tools, one report hub</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Predict wait time */}
        <div className="surface-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f83c2]/15">
              <Brain className="h-5 w-5 text-[#80d7ff]" />
            </div>
            <div>
              <h2 className="font-bold text-[#eaf1ff]">Wait Time Prediction</h2>
              <p className="text-xs text-[#9ab2d7]">Estimate hospital queue time using ML</p>
            </div>
          </div>

          <form onSubmit={pForm.handleSubmit(onPredict)} className="space-y-3">
            <Input label="Patients currently waiting" type="number" placeholder="e.g. 10" error={pForm.formState.errors.patients_waiting?.message} {...pForm.register('patients_waiting')} />
            <Input label="Avg consultation time (min)" type="number" placeholder="e.g. 15" error={pForm.formState.errors.avg_consult_minutes?.message} {...pForm.register('avg_consult_minutes')} />
            <Input label="Doctors available" type="number" placeholder="e.g. 3" error={pForm.formState.errors.doctors_available?.message} {...pForm.register('doctors_available')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Your age (optional)" type="number" placeholder="e.g. 30" {...pForm.register('age')} />
              <Input label="Appointment hour (0-23)" type="number" placeholder="e.g. 10" {...pForm.register('appointment_hour')} />
            </div>
            {predictError && <p className="rounded-lg border border-[#f56565]/30 bg-[#f56565]/10 px-3 py-2 text-sm text-[#ffadad]">{predictError}</p>}
            <Button type="submit" className="w-full" loading={pForm.formState.isSubmitting}>
              <Zap className="h-4 w-4" /> Predict Wait Time
            </Button>
          </form>

          {predictResult && (
            <div className="mt-5 space-y-3 rounded-xl border border-[#1f83c2]/35 bg-[#1f83c2]/10 p-4 animate-fadein">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#9ab2d7]">Predicted Wait Time</span>
                <span className="text-xl font-bold text-[#80d7ff]">{predictResult['Predicted Wait Time']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#9ab2d7]">Resource Load</span>
                <span className={`text-sm font-bold ${loadColor}`}>{predictResult['Resource Load']}</span>
              </div>
              <p className="border-t border-[#2a3d62] pt-3 text-xs leading-relaxed text-[#9ab2d7]">{predictResult.Reason}</p>
              {predictResult._breakdown && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-[#0a1326] p-2">
                    <p className="text-xs text-[#9ab2d7]">Base Queue</p>
                    <p className="text-sm font-bold text-[#eaf1ff]">{predictResult._breakdown.base_queue_wait_minutes}m</p>
                  </div>
                  <div className="rounded-lg bg-[#0a1326] p-2">
                    <p className="text-xs text-[#9ab2d7]">ML Adjustment</p>
                    <p className="text-sm font-bold text-[#eaf1ff]">{predictResult._breakdown.ml_demographic_adjustment_minutes}m</p>
                  </div>
                  <div className="rounded-lg bg-[#0a1326] p-2">
                    <p className="text-xs text-[#9ab2d7]">Pts/Doctor</p>
                    <p className="text-sm font-bold text-[#eaf1ff]">{predictResult._breakdown.patients_per_doctor}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Symptom check */}
        <div className="surface-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7d5cff]/15">
              <Activity className="h-5 w-5 text-[#baa8ff]" />
            </div>
            <div>
              <h2 className="font-bold text-[#eaf1ff]">Symptom Checker</h2>
              <p className="text-xs text-[#9ab2d7]">Get a quick AI triage recommendation</p>
            </div>
          </div>

          <form onSubmit={sForm.handleSubmit(onSymptom)} className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#9db0cf]">Enter your symptoms</label>
              <textarea
                placeholder="e.g. fever, headache, sore throat"
                rows={4}
                className="resize-none rounded-xl border border-[#2a3d62] bg-[#0a1326] p-3 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#7d5cff]/60 focus:outline-none focus:ring-2 focus:ring-[#7d5cff]/25"
                {...sForm.register('symptoms')}
              />
              {sForm.formState.errors.symptoms && <p className="text-xs text-[#ffadad]">{sForm.formState.errors.symptoms.message}</p>}
            </div>
            {symptomError && <p className="rounded-lg border border-[#f56565]/30 bg-[#f56565]/10 px-3 py-2 text-sm text-[#ffadad]">{symptomError}</p>}
            <Button type="submit" className="w-full bg-gradient-to-r from-[#6f57ee] to-[#4f87f7] hover:brightness-110" loading={sForm.formState.isSubmitting}>
              <Send className="h-4 w-4" /> Check Symptoms
            </Button>
          </form>

          {symptomResult && (
            <div className="mt-5 space-y-3 rounded-xl border border-[#7d5cff]/30 bg-[#7d5cff]/10 p-4 animate-fadein">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#9ab2d7]">Triage Level</span>
                <span className="text-sm font-bold capitalize text-[#baa8ff]">{String(symptomResult.triage)}</span>
              </div>
              <div>
                <p className="mb-1 text-xs text-[#9ab2d7]">Recommendation</p>
                <p className="text-sm text-[#eaf1ff]">{String(symptomResult.recommendation)}</p>
              </div>
              {symptomResult.note ? (
                <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Info: {String(symptomResult.note)}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
