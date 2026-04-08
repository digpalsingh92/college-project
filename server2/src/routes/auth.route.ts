import express from 'express';
import {
	doctorLoginController,
	doctorSignupController,
	patientLoginController,
	patientSignupController,
	upsertDoctorProfileController,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/patient/signup', patientSignupController);
router.post('/patient/login', patientLoginController);

router.post('/doctor/signup', doctorSignupController);
router.post('/doctor/login', doctorLoginController);
router.patch('/doctor/profile', upsertDoctorProfileController);

export default router