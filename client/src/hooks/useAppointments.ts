'use client';

import { useState, useCallback } from 'react';
import { patientApi, doctorApi } from '@/lib/api';
import { Appointment } from '@/types';
import { extractApiError } from '@/utils';
import { useAuthStore } from '@/store/authStore';

export function useAppointments() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientAppointments = useCallback(async (params?: object) => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getAppointments(params);
      setAppointments(res.data.appointments);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDoctorAppointments = useCallback(async (params?: object) => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorApi.getAppointments(params);
      setAppointments(res.data.appointments);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointment = useCallback(async (data: object) => {
    const res = await patientApi.createAppointment(data);
    return res.data.appointment as Appointment;
  }, []);

  const cancelAppointment = useCallback(async (id: string) => {
    await patientApi.cancelAppointment(id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addDoctorNotes = useCallback(async (id: string, data: object) => {
    const res = await doctorApi.addNotes(id, data);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? res.data.appointment : a))
    );
    return res.data.appointment as Appointment;
  }, []);

  return {
    appointments,
    loading,
    error,
    user,
    fetchPatientAppointments,
    fetchDoctorAppointments,
    createAppointment,
    cancelAppointment,
    addDoctorNotes,
  };
}
