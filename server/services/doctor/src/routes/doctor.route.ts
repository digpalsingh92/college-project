import express from 'express';
import { requireDoctorAuth } from '../middlewares/auth.middleware';
import { getDoctorProfileController, updateDoctorProfileController } from '../controllers/doctor.controller';
import { asyncHandler } from '../utils/async-handler';

const router = express.Router();

router.get('/profile', requireDoctorAuth, asyncHandler(getDoctorProfileController));


router.put('/update-profile', requireDoctorAuth, asyncHandler(updateDoctorProfileController));

export default router;