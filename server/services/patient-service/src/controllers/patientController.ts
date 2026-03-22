import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';

const getJwtSecret = (): string => process.env.JWT_SECRET || 'changeme';
const getJwtExpires = (): SignOptions['expiresIn'] => (process.env.JWT_EXPIRES as SignOptions['expiresIn']) || '7d';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, address } = req.body;

    const existing = await prisma.patient.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        password: hashed,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
      },
    });

    const token = jwt.sign({ id: patient.id, email: patient.email, name: patient.name, role: 'patient' }, getJwtSecret(), { expiresIn: getJwtExpires() });
    res.status(201).json({ token, patient: { id: patient.id, name: patient.name, email: patient.email, role: patient.role } });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const patient = await prisma.patient.findUnique({ where: { email } });
    if (!patient) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, patient.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: patient.id, email: patient.email, name: patient.name, role: 'patient' }, getJwtSecret(), { expiresIn: getJwtExpires() });
    res.json({ token, patient: { id: patient.id, name: patient.name, email: patient.email, role: patient.role } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
};

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const patient = await prisma.patient.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        medicalHistory: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json({ patient });
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, phone, dateOfBirth, gender, address } = req.body;

    const existing = await prisma.patient.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const patient = await prisma.patient.update({
      where: { id: userId },
      data: {
        name,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        medicalHistory: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json({ patient });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ── Admin helpers ─────────────────────────────────────────────────────────────

export const getAllPatients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const patients = await prisma.patient.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        medicalHistory: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ patients });
  } catch {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        medicalHistory: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json({ patient });
  } catch {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

export const updatePatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, dateOfBirth, gender, address, medicalHistory, isActive } = req.body;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        medicalHistory,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        medicalHistory: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ patient });
  } catch {
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

export const deletePatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    await prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Patient deactivated successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};
