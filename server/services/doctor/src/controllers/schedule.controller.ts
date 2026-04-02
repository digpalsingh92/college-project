import { Request, Response } from 'express';
import { createDoctorSchedule, GetDoctorSchedule, } from '../services/schedule.service';

export const PostSchedule = async (req: Request, res: Response) => {
    try {

        const doctorId = req.user?.id;
        const { dayOfWeek, startTime, endTime } = req.body;
        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }


        const schedule = await createDoctorSchedule(doctorId, { dayOfWeek, startTime, endTime });

        return res.status(201).json({ success: true, data: schedule });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}


export const GetSchedule = async (req: Request, res: Response) => {
    try {
        const doctorId = req.user?.id;

        if (!doctorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const schedule = await GetDoctorSchedule(doctorId);

        return res.status(200).json({
            success: true,
            data: schedule,
        });

    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};