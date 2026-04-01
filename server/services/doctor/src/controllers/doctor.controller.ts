import { Request, Response } from 'express';
import { getDoctorProfile, updateDoctorProfile } from '../services/doctor.service';
import { AppError } from '../utils/app-error';

export const getDoctorProfileController = async (req: Request, res: Response): Promise<void> => {
  const doctorId = req.user?.id;
  if (!doctorId) {
    throw new AppError('Unauthorized', 401);
  }

  const doctor = await getDoctorProfile(doctorId);
  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  res.status(200).json({
    success: true,
    data: doctor,
  });
};

export const updateDoctorProfileController = async (req: Request, res: Response): Promise<void> => {
  const doctorId = req.user?.id; 
    const updateData = req.body;

  if (!doctorId) {
    throw new AppError('Unauthorized', 401);
  }

  const updatedDoctor = await updateDoctorProfile(doctorId, updateData);
  if (!updatedDoctor) {
    throw new AppError('Doctor not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedDoctor,
  });
};