import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../lib/prisma';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
const INTERNAL_SYNC_SECRET = process.env.INTERNAL_SYNC_SECRET || 'sync-secret';

const syncAppointmentToPatientService = async (appointment: any): Promise<void> => {
  await axios.post(
    `${PATIENT_SERVICE_URL}/api/patients/internal/appointments/sync`,
    { appointment },
    { headers: { 'x-internal-secret': INTERNAL_SYNC_SECRET } }
  );
};

// ── Get Doctor's Appointments ──────────────────────────────────────────────

export const getDoctorAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.params.doctorId || (req.headers['x-user-id'] as string);
    const { status, upcomingOnly } = req.query;

    const query: any = { doctorId };

    if (typeof status === 'string' && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      query.status = status;
    }

    if (upcomingOnly === 'true') {
      query.appointmentDate = { gte: new Date() };
    }

    const appointments = await prisma.appointment.findMany({
      where: query,
      orderBy: { appointmentDate: 'asc' },
    });

    res.json({
      count: appointments.length,
      appointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// ── Add Doctor Notes to Appointment ───────────────────────────────────────────

export const addDoctorNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { doctorNotes, prescriptions } = req.body;
    const doctorId = req.headers['x-user-id'] as string;

    const existing = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        doctorNotes,
        prescriptions,
        status: 'completed' as any,
      },
    });

    try {
      await syncAppointmentToPatientService(appointment);
    } catch {
      await prisma.appointment.update({
        where: { id: existing.id },
        data: {
          patientId: existing.patientId,
          doctorId: existing.doctorId,
          appointmentDate: existing.appointmentDate,
          status: existing.status as any,
          reason: existing.reason,
          symptoms: existing.symptoms,
          doctorNotes: existing.doctorNotes,
          prescriptions: existing.prescriptions,
          duration: existing.duration,
        },
      });
      res.status(502).json({ error: 'Failed to sync appointment with patient service' });
      return;
    }

    res.json({
      message: 'Doctor notes added successfully',
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add doctor notes' });
  }
};

// ── Internal sync (from patient service) ────────────────────────────────────

export const syncMirroredAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== INTERNAL_SYNC_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { appointment } = req.body;
    if (!appointment?.id || !appointment?.patientId || !appointment?.doctorId || !appointment?.appointmentDate || !appointment?.status) {
      res.status(400).json({ error: 'Invalid appointment payload' });
      return;
    }

    if (!VALID_STATUSES.includes(appointment.status as (typeof VALID_STATUSES)[number])) {
      res.status(400).json({ error: 'Invalid appointment status' });
      return;
    }

    const synced = await prisma.appointment.upsert({
      where: { id: appointment.id },
      update: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: new Date(appointment.appointmentDate),
        status: appointment.status as any,
        reason: appointment.reason,
        symptoms: appointment.symptoms || [],
        doctorNotes: appointment.doctorNotes,
        prescriptions: appointment.prescriptions || [],
        duration: appointment.duration || 30,
      },
      create: {
        id: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: new Date(appointment.appointmentDate),
        status: appointment.status as any,
        reason: appointment.reason,
        symptoms: appointment.symptoms || [],
        doctorNotes: appointment.doctorNotes,
        prescriptions: appointment.prescriptions || [],
        duration: appointment.duration || 30,
      },
    });

    res.json({ message: 'Appointment synced', appointment: synced });
  } catch {
    res.status(500).json({ error: 'Failed to sync mirrored appointment' });
  }
};
