import express from 'express';
import {
	adminLogin,
	doctorLogin,
	doctorRegister,
	patientLogin,
	patientRegister,
} from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import {
	loginSchema,
	registerDoctorSchema,
	registerPatientSchema,
} from '../schemas/auth.schemas.js';

const router = express.Router();

router.post('/doctor/register', validateRequest({ body: registerDoctorSchema }), asyncHandler(doctorRegister));
router.post('/doctor/login', validateRequest({ body: loginSchema }), asyncHandler(doctorLogin));
router.post('/admin/login', validateRequest({ body: loginSchema }), asyncHandler(adminLogin));
router.post('/register', validateRequest({ body: registerPatientSchema }), asyncHandler(patientRegister));
router.post('/login', validateRequest({ body: loginSchema }), asyncHandler(patientLogin));

export default router