'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Shield, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { extractApiError } from '@/utils';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const { loginAsAdmin } = useAuth();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormData) => {
    setApiError('');
    try {
      await loginAsAdmin(email, password);
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadein">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-600 items-center justify-center mb-4 shadow-lg shadow-emerald-600/30">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Admin Sign In</h1>
          <p className="text-[#475569] text-sm mt-1">Access the management panel</p>
        </div>
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="admin@medcare.com" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="Your password" leftIcon={<Lock className="w-4 h-4" />} error={errors.password?.message} {...register('password')} />
            {apiError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{apiError}</p>}
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20" size="lg" loading={isSubmitting}>Sign In as Admin</Button>
          </form>
          <p className="text-center text-sm text-[#475569] mt-6">
            <Link href="/" className="hover:text-[#0f172a]">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
