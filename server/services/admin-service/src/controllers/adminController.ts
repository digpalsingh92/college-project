import { Request, Response } from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';

const getJwtSecret = (): string => process.env.JWT_SECRET || 'changeme';
const getJwtExpires = (): SignOptions['expiresIn'] => (process.env.JWT_EXPIRES as SignOptions['expiresIn']) || '7d';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashed,
        role,
      },
    });
    const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name, role: admin.role }, getJwtSecret(), { expiresIn: getJwtExpires() });

    res.status(201).json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name, role: admin.role }, getJwtSecret(), { expiresIn: getJwtExpires() });
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
};

// ── User management ───────────────────────────────────────────────────────────

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  // Placeholder – in production aggregate stats from other services via HTTP calls
  res.json({
    stats: {
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      pendingApprovals: 0,
    },
  });
};

export const getAllAdmins = async (_req: Request, res: Response): Promise<void> => {
  try {
    const admins = await prisma.admin.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ admins });
  } catch {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

export const updateAdminStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    const admin = await prisma.admin.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }
    res.json({ admin });
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
};

// ── Doctor Management Orchestration ────────────────────────────────────────

const getDoctorServiceUrl = (): string => process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';

export const getAllDoctors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${getDoctorServiceUrl()}/api/doctors`);
    res.json({ doctors: response.data.doctors || [] });
  } catch (err: any) {
    console.error('Failed to fetch doctors:', err.message);
    res.status(500).json({ error: 'Failed to fetch doctors from doctor service' });
  }
};

export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${getDoctorServiceUrl()}/api/doctors/${id}`);
    res.json(response.data);
  } catch (err: any) {
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Doctor not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch doctor' });
    }
  }
};

export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, specialization, licenseNumber, qualifications, experience, bio } = req.body;

    const response = await axios.post(`${getDoctorServiceUrl()}/api/doctors/auth/register`, {
      name,
      email,
      password,
      phone,
      specialization,
      licenseNumber,
      qualifications,
      experience,
      bio,
    });

    res.status(201).json(response.data);
  } catch (err: any) {
    if (err.response?.status === 409) {
      res.status(409).json({ error: 'Doctor with this email or license already exists' });
    } else {
      console.error('Failed to create doctor:', err.message);
      res.status(500).json({ error: 'Failed to create doctor' });
    }
  }
};

export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { bio, phone, qualifications, experience } = req.body;

    const response = await axios.put(
      `${getDoctorServiceUrl()}/api/doctors/${id}`,
      { bio, phone, qualifications, experience },
      { headers: { 'x-user-id': 'admin', 'x-user-role': 'admin' } }
    );

    res.json(response.data);
  } catch (err: any) {
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Doctor not found' });
    } else {
      console.error('Failed to update doctor:', err.message);
      res.status(500).json({ error: 'Failed to update doctor' });
    }
  }
};

export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const response = await axios.delete(
      `${getDoctorServiceUrl()}/api/doctors/${id}`,
      { headers: { 'x-user-id': 'admin', 'x-user-role': 'admin' } }
    );

    res.json(response.data);
  } catch (err: any) {
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Doctor not found' });
    } else {
      console.error('Failed to delete doctor:', err.message);
      res.status(500).json({ error: 'Failed to delete doctor' });
    }
  }
};

// ── Patient Management Orchestration ───────────────────────────────────────

const getPatientServiceUrl = (): string => process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';

export const getAllPatients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${getPatientServiceUrl()}/api/patients`, {
      headers: { 'x-user-id': 'admin', 'x-user-role': 'admin' },
    });
    res.json({ patients: response.data.patients || [] });
  } catch (err: any) {
    console.error('Failed to fetch patients:', err.message);
    res.status(500).json({ error: 'Failed to fetch patients from patient service' });
  }
};

export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${getPatientServiceUrl()}/api/patients/${id}`, {
      headers: { 'x-user-id': 'admin', 'x-user-role': 'admin' },
    });
    res.json(response.data);
  } catch (err: any) {
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Patient not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch patient' });
    }
  }
};

export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, address } = req.body;

    const response = await axios.post(`${getPatientServiceUrl()}/api/patients/auth/register`, {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
    });

    res.status(201).json(response.data);
  } catch (err: any) {
    if (err.response?.status === 409) {
      res.status(409).json({ error: 'Patient with this email already exists' });
    } else {
      console.error('Failed to create patient:', err.message);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  }
};

export const updatePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, dateOfBirth, gender, address } = req.body;

    const response = await axios.put(
      `${getPatientServiceUrl()}/api/patients/${id}`,
      { name, phone, dateOfBirth, gender, address },
      { headers: { 'x-user-id': 'admin', 'x-user-role': 'admin' } }
    );

    res.json(response.data);
  } catch (err: any) {
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Patient not found' });
    } else {
      console.error('Failed to update patient:', err.message);
      res.status(500).json({ error: 'Failed to update patient' });
    }
  }
};

export const deletePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const response = await axios.delete(
      `${getPatientServiceUrl()}/api/patients/${id}`,
      { headers: { 'x-user-id': 'admin', 'x-user-role': 'admin' } }
    );

    res.json(response.data);
  } catch (err: any) {
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Patient not found' });
    } else {
      console.error('Failed to delete patient:', err.message);
      res.status(500).json({ error: 'Failed to delete patient' });
    }
  }
};
