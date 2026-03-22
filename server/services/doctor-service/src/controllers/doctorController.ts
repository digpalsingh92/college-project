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
    const { name, email, password, phone, specialization, licenseNumber, qualifications, experience, bio } = req.body;

    const existingByEmail = await prisma.doctor.findUnique({ where: { email } });
    const existingByLicense = await prisma.doctor.findUnique({ where: { licenseNumber } });
    const existing = existingByEmail || existingByLicense;
    if (existing) {
      res.status(409).json({ error: 'Email or license number already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const doctor = await prisma.doctor.create({
      data: {
        name,
        email,
        password: hashed,
        phone,
        specialization,
        licenseNumber,
        qualifications: qualifications || [],
        experience: experience || 0,
        bio,
      },
    });

    const token = jwt.sign({ id: doctor.id, email: doctor.email, name: doctor.name, role: 'doctor' }, getJwtSecret(), { expiresIn: getJwtExpires() });
    res.status(201).json({ token, doctor: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization, role: doctor.role } });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const doctor = await prisma.doctor.findUnique({ where: { email } });
    if (!doctor) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, doctor.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: doctor.id, email: doctor.email, name: doctor.name, role: 'doctor' }, getJwtSecret(), { expiresIn: getJwtExpires() });
    res.json({ token, doctor: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization, role: doctor.role } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
};

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const doctor = await prisma.doctor.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
        licenseNumber: true,
        qualifications: true,
        experience: true,
        bio: true,
        availableSlots: true,
        rating: true,
        isVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ doctor });
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, phone, bio, experience, qualifications, availableSlots } = req.body;

    const existing = await prisma.doctor.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    const doctor = await prisma.doctor.update({
      where: { id: userId },
      data: { name, phone, bio, experience, qualifications, availableSlots },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
        licenseNumber: true,
        qualifications: true,
        experience: true,
        bio: true,
        availableSlots: true,
        rating: true,
        isVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ doctor });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ── Public listing ────────────────────────────────────────────────────────────

export const getAllDoctors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true, isVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
        licenseNumber: true,
        qualifications: true,
        experience: true,
        bio: true,
        availableSlots: true,
        rating: true,
        isVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ doctors });
  } catch {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
        licenseNumber: true,
        qualifications: true,
        experience: true,
        bio: true,
        availableSlots: true,
        rating: true,
        isVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ doctor });
  } catch {
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
};

export const getDoctorsBySpecialization = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        specialization: {
          contains: req.params.specialization,
          mode: 'insensitive',
        },
        isActive: true,
        isVerified: true,
      },
    });
    res.json({ doctors });
  } catch {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

// ── Admin CRUD ───────────────────────────────────────────────────────────────

export const updateDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      specialization,
      qualifications,
      experience,
      bio,
      availableSlots,
      isVerified,
      isActive,
    } = req.body;

    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name,
        phone,
        specialization,
        qualifications,
        experience,
        bio,
        availableSlots,
        isVerified,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
        licenseNumber: true,
        qualifications: true,
        experience: true,
        bio: true,
        availableSlots: true,
        rating: true,
        isVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ doctor });
  } catch {
    res.status(500).json({ error: 'Failed to update doctor' });
  }
};

export const deleteDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    await prisma.doctor.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Doctor deactivated successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
};
