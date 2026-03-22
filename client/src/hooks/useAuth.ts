'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { patientApi, doctorApi, adminApi } from '@/lib/api';
import { extractApiError } from '@/utils';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const loginAsPatient = async (email: string, password: string) => {
    const res = await patientApi.login({ email, password });
    const { token, patient } = res.data;
    setAuth(token, { id: patient.id, name: patient.name, email: patient.email, role: 'patient' });
    router.push('/patient/dashboard');
  };

  const loginAsDoctor = async (email: string, password: string) => {
    const res = await doctorApi.login({ email, password });
    const { token, doctor } = res.data;
    setAuth(token, { id: doctor.id, name: doctor.name, email: doctor.email, role: 'doctor' });
    router.push('/doctor/dashboard');
  };

  const loginAsAdmin = async (email: string, password: string) => {
    const res = await adminApi.login({ email, password });
    const { token, admin } = res.data;
    setAuth(token, { id: admin.id, name: admin.name, email: admin.email, role: admin.role as UserRole });
    router.push('/admin/dashboard');
  };

  const registerPatient = async (data: object) => {
    const res = await patientApi.register(data);
    const { token, patient } = res.data;
    setAuth(token, { id: patient.id, name: patient.name, email: patient.email, role: 'patient' });
    router.push('/patient/dashboard');
  };

  const registerDoctor = async (data: object) => {
    const res = await doctorApi.register(data);
    const { token, doctor } = res.data;
    setAuth(token, { id: doctor.id, name: doctor.name, email: doctor.email, role: 'doctor' });
    router.push('/doctor/dashboard');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return {
    user,
    token,
    isAuthenticated,
    loginAsPatient,
    loginAsDoctor,
    loginAsAdmin,
    registerPatient,
    registerDoctor,
    logout: handleLogout,
    extractApiError,
  };
}
