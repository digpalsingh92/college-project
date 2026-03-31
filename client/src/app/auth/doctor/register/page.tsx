'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Stethoscope, Mail, Lock, User, Hash, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { extractApiError } from '@/utils';
import { SPECIALIZATIONS } from '@/constants';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  specialization: z.string().min(1, 'Specialization is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  experience: z.coerce.number().min(0).optional(),
});
type FormData = z.infer<typeof schema>;
type RawFormData = z.input<typeof schema>;

export default function DoctorRegisterPage() {
  const { registerDoctor } = useAuth();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RawFormData, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await registerDoctor(data);
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadein">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-purple-600 items-center justify-center mb-4 shadow-lg shadow-purple-600/30">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Doctor Registration</h1>
          <p className="text-[#475569] text-sm mt-1">Join our healthcare network</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="Dr. Jane Smith" leftIcon={<User className="w-4 h-4" />} error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="dr.you@hospital.com" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="Min 8 characters" leftIcon={<Lock className="w-4 h-4" />} error={errors.password?.message} {...register('password')} />
            <Input label="License Number" placeholder="MCI-12345" leftIcon={<Hash className="w-4 h-4" />} error={errors.licenseNumber?.message} {...register('licenseNumber')} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#475569]">Specialization</label>
              <select
                className="w-full h-11 bg-[#f0f4f8] border border-[#cbd5e1] rounded-xl text-[#0f172a] text-sm px-4 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                {...register('specialization')}
              >
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.specialization && <p className="text-xs text-red-400">{errors.specialization.message}</p>}
            </div>

            <Input label="Years of Experience" type="number" placeholder="5" leftIcon={<Briefcase className="w-4 h-4" />} {...register('experience')} />

            {apiError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{apiError}</p>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500" size="lg" loading={isSubmitting}>Register as Doctor</Button>
          </form>

          <p className="text-center text-sm text-[#475569] mt-6">
            Already registered?{' '}
            <Link href="/auth/doctor/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
