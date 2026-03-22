import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient';

const JWT_SECRET  = process.env.JWT_SECRET  || 'changeme';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, address } = req.body;

    const existing = await Patient.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const patient = await Patient.create({ name, email, password: hashed, phone, dateOfBirth, gender, address });

    const token = jwt.sign({ id: patient._id, role: 'patient' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ token, patient: { id: patient._id, name: patient.name, email: patient.email, role: patient.role } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ email }).select('+password');
    if (!patient) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, patient.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: patient._id, role: 'patient' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, patient: { id: patient._id, name: patient.name, email: patient.email, role: patient.role } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
};

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const patient = await Patient.findById(userId);
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

    const patient = await Patient.findByIdAndUpdate(
      userId,
      { name, phone, dateOfBirth, gender, address },
      { new: true, runValidators: true }
    );

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
    const patients = await Patient.find({ isActive: true }).select('-__v');
    res.json({ patients });
  } catch {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json({ patient });
  } catch {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};
