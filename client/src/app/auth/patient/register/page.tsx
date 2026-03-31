'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Heart, Mail, Lock, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { extractApiError } from '@/utils';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function PatientRegisterPage() {
  const { registerPatient } = useAuth();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await registerPatient(data);
    } catch (err) {
      setApiError(extractApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadein">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Create Patient Account</h1>
          <p className="text-[#475569] text-sm mt-1">Start managing your health today</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" leftIcon={<User className="w-4 h-4" />} error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="you@email.com" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="Min 8 characters" leftIcon={<Lock className="w-4 h-4" />} error={errors.password?.message} {...register('password')} />
            <Input label="Phone (optional)" placeholder="+91 00000 00000" leftIcon={<Phone className="w-4 h-4" />} {...register('phone')} />

            {apiError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{apiError}</p>}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Create Account</Button>
          </form>

          <p className="text-center text-sm text-[#475569] mt-6">
            Already have an account?{' '}
            <Link href="/auth/patient/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
