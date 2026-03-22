import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllPatients,
  getPatientById,
} from '../controllers/patientController';
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

// ── Internal / admin access ───────────────────────────────────────────────────
router.get('/', getAllPatients);
router.get('/:id', getPatientById);

export default router;
