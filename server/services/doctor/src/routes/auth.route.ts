import express from 'express';
import {
  createDoctorController,
  listDoctorsController,
  loginDoctorController,
  registerDoctorController,
} from '../controllers/auth.controller';
import { createDoctorSchema, loginDoctorSchema, registerDoctorSchema } from '../schemas/auth.schema';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = express.Router();

router.post('/register', validate(registerDoctorSchema), asyncHandler(registerDoctorController));

router.post('/login', validate(loginDoctorSchema), asyncHandler(loginDoctorController));


router.post('/', validate(createDoctorSchema), asyncHandler(createDoctorController));

router.get('/', asyncHandler(listDoctorsController));

export default router;
