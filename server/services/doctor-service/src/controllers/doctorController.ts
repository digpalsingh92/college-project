import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Doctor from '../models/Doctor';

const JWT_SECRET  = process.env.JWT_SECRET  || 'changeme';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, specialization, licenseNumber, qualifications, experience, bio } = req.body;

    const existing = await Doctor.findOne({ $or: [{ email }, { licenseNumber }] });
    if (existing) {
      res.status(409).json({ error: 'Email or license number already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const doctor = await Doctor.create({
      name, email, password: hashed, phone,
      specialization, licenseNumber, qualifications, experience, bio,
    });

    const token = jwt.sign({ id: doctor._id, role: 'doctor' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ token, doctor: { id: doctor._id, name: doctor.name, email: doctor.email, specialization: doctor.specialization, role: doctor.role } });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, doctor.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: doctor._id, role: 'doctor' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, doctor: { id: doctor._id, name: doctor.name, email: doctor.email, specialization: doctor.specialization, role: doctor.role } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
};

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const doctor = await Doctor.findById(userId);
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

    const doctor = await Doctor.findByIdAndUpdate(
      userId,
      { name, phone, bio, experience, qualifications, availableSlots },
      { new: true, runValidators: true }
    );

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
    const doctors = await Doctor.find({ isActive: true, isVerified: true }).select('-__v');
    res.json({ doctors });
  } catch {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.findById(req.params.id);
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
    const doctors = await Doctor.find({
      specialization: { $regex: req.params.specialization, $options: 'i' },
      isActive: true,
      isVerified: true,
    });
    res.json({ doctors });
  } catch {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};
