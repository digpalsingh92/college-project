import { Request, Response } from 'express';
import { createDoctor, listDoctors, loginDoctor, registerDoctor } from '../services/auth.service';

export const createDoctorController = async (req: Request, res: Response): Promise<void> => {
  const doctor = await createDoctor(req.body);
  res.status(201).json({
    success: true,
    message: 'Doctor created successfully',
    data: doctor,
  });
};

export const registerDoctorController = async (req: Request, res: Response): Promise<void> => {
  const result = await registerDoctor(req.body);
  res.status(201).json({
    success: true,
    message: 'Doctor registered successfully',
    data: result,
  });
};

export const loginDoctorController = async (req: Request, res: Response): Promise<void> => {
  const result = await loginDoctor(req.body);
  res.status(200).json({
    success: true,
    message: 'Doctor login successfull',
    data: result,
  });
};

export const listDoctorsController = async (_req: Request, res: Response): Promise<void> => {
  const doctors = await listDoctors();
  res.status(200).json({
    success: true,
    data: doctors,
  });
};
