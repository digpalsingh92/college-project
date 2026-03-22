import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDoctorAppointments,
  addDoctorNotes,
} from '../controllers/appointmentController';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// ── Get Doctor's Appointments ─────────────────────────────────────────────────
router.get('/appointments/upcoming', (req, res) => {
  req.query.upcomingOnly = 'true';
  getDoctorAppointments(req, res);
});

router.get('/appointments', getDoctorAppointments);

// ── Add Doctor Notes to Appointment ───────────────────────────────────────────
router.put('/appointments/:appointmentId/notes', [
  body('doctorNotes').notEmpty().withMessage('Doctor notes are required'),
  body('prescriptions').optional().isArray(),
], validateRequest, addDoctorNotes);

export default router;
