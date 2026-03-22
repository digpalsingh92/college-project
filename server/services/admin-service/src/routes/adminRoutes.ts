import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getDashboardStats,
  getAllAdmins,
  updateAdminStatus,
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
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllAdmins);
router.patch('/users/:id/status', updateAdminStatus);

export default router;
