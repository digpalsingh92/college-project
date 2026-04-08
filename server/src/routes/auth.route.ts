import express from 'express';
import {
	doctorLogin,
	doctorRegister,
	patientLogin,
	patientRegister,
} from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();

router.post('/doctor/register', asyncHandler(doctorRegister));
router.post('/doctor/login', asyncHandler(doctorLogin));
router.post('/register', asyncHandler(patientRegister));
router.post('/login', asyncHandler(patientLogin));

export default router