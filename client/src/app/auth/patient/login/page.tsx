'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Heart, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { extractApiError } from '@/utils';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function PatientLoginPage() {
  const { loginAsPatient } = useAuth();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormData) => {
    setApiError('');
    try {
      await loginAsPatient(email, password);
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadein">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#e8eaf0]">Patient Sign In</h1>
          <p className="text-[#8892a4] text-sm mt-1">Access your health dashboard</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@email.com" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="Your password" leftIcon={<Lock className="w-4 h-4" />} error={errors.password?.message} {...register('password')} />

            {apiError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{apiError}</p>}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Sign In</Button>
          </form>

          <p className="text-center text-sm text-[#8892a4] mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/patient/register" className="text-blue-400 hover:text-blue-300 font-medium">Register</Link>
          </p>
          <p className="text-center text-sm text-[#8892a4] mt-2">
            <Link href="/" className="text-[#8892a4] hover:text-[#e8eaf0]">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
