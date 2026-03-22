'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Zap, Activity, Send } from 'lucide-react';
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

const symptomSchema = z.object({ symptoms: z.string().min(2) });
type SymptomForm = z.infer<typeof symptomSchema>;

export default function PatientReportsPage() {
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);
  const [symptomResult, setSymptomResult] = useState<Record<string, unknown> | null>(null);
  const [predictError, setPredictError]   = useState('');
  const [symptomError, setSymptomError]   = useState('');

  const pForm = useForm<PredictForm>({ resolver: zodResolver(predictSchema) });
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
    <div className="animate-fadein">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#e8eaf0]">AI Health Reports</h1>
        <p className="text-sm text-[#8892a4] mt-1">AI-powered wait time predictions and symptom triage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Predict wait time */}
        <div className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-[#e8eaf0]">Wait Time Prediction</h2>
              <p className="text-xs text-[#8892a4]">Estimate hospital queue time using ML</p>
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
            {predictError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{predictError}</p>}
            <Button type="submit" className="w-full" loading={pForm.formState.isSubmitting}>
              <Zap className="w-4 h-4" /> Predict Wait Time
            </Button>
          </form>

          {predictResult && (
            <div className="mt-5 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3 animate-fadein">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#8892a4]">Predicted Wait Time</span>
                <span className="text-xl font-bold text-blue-400">{predictResult['Predicted Wait Time']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#8892a4]">Resource Load</span>
                <span className={`text-sm font-bold ${loadColor}`}>{predictResult['Resource Load']}</span>
              </div>
              <p className="text-xs text-[#8892a4] leading-relaxed border-t border-[#1e2d4a] pt-3">{predictResult.Reason}</p>
              {predictResult._breakdown && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#0a0e1a] rounded-lg p-2">
                    <p className="text-xs text-[#8892a4]">Base Queue</p>
                    <p className="text-sm font-bold text-[#e8eaf0]">{predictResult._breakdown.base_queue_wait_minutes}m</p>
                  </div>
                  <div className="bg-[#0a0e1a] rounded-lg p-2">
                    <p className="text-xs text-[#8892a4]">ML Adjustment</p>
                    <p className="text-sm font-bold text-[#e8eaf0]">{predictResult._breakdown.ml_demographic_adjustment_minutes}m</p>
                  </div>
                  <div className="bg-[#0a0e1a] rounded-lg p-2">
                    <p className="text-xs text-[#8892a4]">Pts/Doctor</p>
                    <p className="text-sm font-bold text-[#e8eaf0]">{predictResult._breakdown.patients_per_doctor}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Symptom check */}
        <div className="rounded-xl border border-[#1e2d4a] bg-[#0f1629] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-[#e8eaf0]">Symptom Checker</h2>
              <p className="text-xs text-[#8892a4]">Get a quick AI triage recommendation</p>
            </div>
          </div>

          <form onSubmit={sForm.handleSubmit(onSymptom)} className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8892a4]">Enter your symptoms</label>
              <textarea
                placeholder="e.g. fever, headache, sore throat"
                rows={4}
                className="bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm p-3 focus:outline-none focus:border-purple-500/60 placeholder:text-[#8892a4] resize-none"
                {...sForm.register('symptoms')}
              />
              {sForm.formState.errors.symptoms && <p className="text-xs text-red-400">{sForm.formState.errors.symptoms.message}</p>}
            </div>
            {symptomError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{symptomError}</p>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500" loading={sForm.formState.isSubmitting}>
              <Send className="w-4 h-4" /> Check Symptoms
            </Button>
          </form>

          {symptomResult && (
            <div className="mt-5 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3 animate-fadein">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#8892a4]">Triage Level</span>
                <span className="text-sm font-bold text-purple-400 capitalize">{String(symptomResult.triage)}</span>
              </div>
              <div>
                <p className="text-xs text-[#8892a4] mb-1">Recommendation</p>
                <p className="text-sm text-[#e8eaf0]">{String(symptomResult.recommendation)}</p>
              </div>
              {symptomResult.note && (
                <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">ℹ️ {String(symptomResult.note)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
