import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getDashboardStats,
  getAllAdmins,
  updateAdminStatus,
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/adminController';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post(
  '/auth/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateRequest,
  register
);

router.post(
  '/auth/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  login
);

// ── Protected ─────────────────────────────────────────────────────────────────

// Admin Management
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllAdmins);
router.patch('/users/:id/status', updateAdminStatus);

// ── Doctor Management Orchestration ────────────────────────────────────────
router.get('/doctors', getAllDoctors);
router.post(
  '/doctors',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password required'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
  ],
  validateRequest,
  createDoctor
);
router.get('/doctors/:id', getDoctorById);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

// ── Patient Management Orchestration ──────────────────────────────────────
router.get('/patients', getAllPatients);
router.post(
  '/patients',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password required'),
  ],
  validateRequest,
  createPatient
);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', deletePatient);

export default router;
