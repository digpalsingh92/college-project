import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllDoctors,
  getDoctorById,
  getDoctorsBySpecialization,
  updateDoctorById,
  deleteDoctorById,
} from '../controllers/doctorController';
import {
  getDoctorAppointments,
  addDoctorNotes,
  syncMirroredAppointment,
} from '../controllers/appointmentController';
import { requireRole } from '../middleware/requireRole';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post(
  '/auth/register',
  requireRole('admin', 'superadmin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
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

router.get('/', getAllDoctors);
router.get('/specialization/:specialization', getDoctorsBySpecialization);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get('/profile/me', getProfile);
router.put('/profile/me', updateProfile);

// ── Appointments (Protected) ───────────────────────────────────────────────────
router.get('/me/appointments', getDoctorAppointments);

router.get('/me/appointments/upcoming', (req, res) => {
  (req.query as Record<string, unknown>).upcomingOnly = 'true';
  getDoctorAppointments(req, res);
});

router.put('/appointments/:appointmentId/notes', [
  body('doctorNotes').notEmpty().withMessage('Doctor notes are required'),
  body('prescriptions').optional().isArray(),
], validateRequest, addDoctorNotes);

// ── Internal sync (service-to-service) ──────────────────────────────────────
router.post('/internal/appointments/sync', syncMirroredAppointment);

router.get('/:id', getDoctorById);

// ── Admin CRUD ───────────────────────────────────────────────────────────────
router.put('/:id', requireRole('admin', 'superadmin'), updateDoctorById);
router.delete('/:id', requireRole('admin', 'superadmin'), deleteDoctorById);

export default router;
