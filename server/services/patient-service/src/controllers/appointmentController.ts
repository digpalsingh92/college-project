import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../lib/prisma';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';
const INTERNAL_SYNC_SECRET = process.env.INTERNAL_SYNC_SECRET || 'sync-secret';

const syncAppointmentToDoctorService = async (appointment: any): Promise<void> => {
  await axios.post(
    `${DOCTOR_SERVICE_URL}/api/doctors/internal/appointments/sync`,
    { appointment },
    { headers: { 'x-internal-secret': INTERNAL_SYNC_SECRET } }
  );
};

// ── Create Appointment ────────────────────────────────────────────────────────

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.headers['x-user-id'] as string;
    const { doctorId, appointmentDate, reason, symptoms, duration } = req.body;

    // Validate appointment date is in the future
    const appointmentTime = new Date(appointmentDate);
    if (appointmentTime <= new Date()) {
      res.status(400).json({ error: 'Appointment date must be in the future' });
      return;
    }

    // Check if patient already has an appointment with this doctor at same time (within 1 hour)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId,
        appointmentDate: {
          gte: new Date(appointmentTime.getTime() - 60 * 60 * 1000),
          lte: new Date(appointmentTime.getTime() + 60 * 60 * 1000),
        },
        NOT: { status: 'cancelled' as any },
      },
    });

    if (existingAppointment) {
      res.status(409).json({ error: 'You already have an appointment with this doctor around that time' });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: appointmentTime,
        reason,
        symptoms: symptoms || [],
        duration: duration || 30,
        status: 'pending' as any,
      },
    });

    try {
      await syncAppointmentToDoctorService(appointment);
    } catch {
      await prisma.appointment.delete({ where: { id: appointment.id } });
      res.status(502).json({ error: 'Failed to sync appointment with doctor service' });
      return;
    }

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// ── Get Patient's Appointments ────────────────────────────────────────────────

export const getPatientAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.headers['x-user-id'] as string;
    const { status, upcomingOnly } = req.query;

    const query: any = { patientId };

    if (typeof status === 'string' && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      query.status = status;
    }

    if (upcomingOnly === 'true') {
      query.appointmentDate = { gte: new Date() };
    }

    const appointments = await prisma.appointment.findMany({
      where: query,
      orderBy: { appointmentDate: 'desc' },
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

// ── Get Specific Appointment ──────────────────────────────────────────────────

export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.headers['x-user-id'] as string;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
      },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    res.json({ appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// ── Update Appointment Status ─────────────────────────────────────────────────

export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.headers['x-user-id'] as string;
    const { status, doctorNotes, prescriptions } = req.body;

    if (typeof status !== 'string' || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const existing = await prisma.appointment.findFirst({ where: { id: appointmentId, patientId } });
    if (!existing) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status as any,
        doctorNotes,
        prescriptions,
      },
    });

    try {
      await syncAppointmentToDoctorService(appointment);
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
      res.status(502).json({ error: 'Failed to sync appointment with doctor service' });
      return;
    }

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// ── Cancel Appointment ────────────────────────────────────────────────────────

export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.headers['x-user-id'] as string;

    const existing = await prisma.appointment.findFirst({ where: { id: appointmentId, patientId } });
    if (!existing) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'cancelled' as any },
    });

    try {
      await syncAppointmentToDoctorService(appointment);
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
      res.status(502).json({ error: 'Failed to sync appointment with doctor service' });
      return;
    }

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    res.json({
      message: 'Appointment cancelled successfully',
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// ── Get Doctor's Appointments (for doctor service) ──────────────────────────

export const getDoctorAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.params.doctorId;
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

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        doctorNotes,
        prescriptions,
        status: 'completed' as any,
      },
    });

    res.json({
      message: 'Doctor notes added successfully',
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add doctor notes' });
  }
};

// ── Internal sync (from doctor service) ─────────────────────────────────────

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
