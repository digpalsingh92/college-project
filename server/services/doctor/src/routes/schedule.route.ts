import express from 'express';
import { requireDoctorAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import { CreateSchedule, GetSchedule, updateSchedule } from '../controllers/schedule.controller';

const router = express.Router();

router.get('/get-schedule', requireDoctorAuth, asyncHandler(GetSchedule));


router.post('/create-schedule', requireDoctorAuth, asyncHandler(CreateSchedule));

// router.patch('/update-schedule/:id', requireDoctorAuth, asyncHandler(updateSchedule));

export default router;