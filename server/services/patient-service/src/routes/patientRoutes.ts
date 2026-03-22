import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllPatients,
  getPatientById,
  updatePatientById,
  deletePatientById,
} from '../controllers/patientController';
import {
  createAppointment,
  getPatientAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  syncMirroredAppointment,
} from '../controllers/appointmentController';
import { requireRole } from '../middleware/requireRole';
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
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

// ── Protected (token checked at gateway; x-user-id header forwarded) ─────────
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// ── Appointments ──────────────────────────────────────────────────────────────
router.post('/appointments', [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('reason').optional().trim(),
  body('symptoms').optional().isArray(),
], validateRequest, createAppointment);

router.get('/appointments', getPatientAppointments);

router.get('/appointments/:appointmentId', getAppointmentById);

router.put('/appointments/:appointmentId', [
  body('status').notEmpty().isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Valid status is required'),
], validateRequest, updateAppointmentStatus);

router.delete('/appointments/:appointmentId', cancelAppointment);

// ── Internal sync (service-to-service) ──────────────────────────────────────
router.post('/internal/appointments/sync', syncMirroredAppointment);

// ── Internal / admin access ───────────────────────────────────────────────────
router.get('/', requireRole('admin', 'superadmin'), getAllPatients);
router.get('/:id', requireRole('admin', 'superadmin'), getPatientById);
router.put('/:id', requireRole('admin', 'superadmin'), updatePatientById);
router.delete('/:id', requireRole('admin', 'superadmin'), deletePatientById);

export default router;
