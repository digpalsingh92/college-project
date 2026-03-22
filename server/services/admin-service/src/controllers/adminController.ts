import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';

const JWT_SECRET  = process.env.JWT_SECRET  || 'changeme';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin  = await Admin.create({ name, email, password: hashed, role });
    const token  = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
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
    const admins = await Admin.find({ isActive: true }).select('-__v');
    res.json({ admins });
  } catch {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

export const updateAdminStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const admin = await Admin.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }
    res.json({ admin });
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
};
