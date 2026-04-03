import { Request, Response } from 'express';
import { createDoctorSchedule, GetDoctorSchedule, } from '../services/schedule.service';

export const CreateSchedule = async (req: Request, res: Response): Promise<void> => {
    try {

        const doctorId = req.user?.id;
        const { dayOfWeek, startTime, endTime } = req.body;
        if (!doctorId) {
         res.status(401).json({ success: false, message: 'Unauthorized' });
         return;
        }


        const schedule = await createDoctorSchedule(doctorId, { dayOfWeek, startTime, endTime });

         res.status(201).json({ success: true, data: schedule });
    } catch (error: any) {
         res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}


export const GetSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const doctorId = req.user?.id;

        if (!doctorId) {
             res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
             return;
        }

        const schedule = await GetDoctorSchedule(doctorId);

         res.status(200).json({
            success: true,
            data: schedule,
        });

    } catch (error: any) {
         res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
    
}