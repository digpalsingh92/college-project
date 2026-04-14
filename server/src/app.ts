import express from 'express';
import authRoutes from './routes/auth.route.js';
import doctorRoutes from './routes/schedule.route.js';
import recommendationRoutes from './routes/recommendations.route.js';
import appointmentRoutes from './routes/appointment.route.js';
import predictionRoutes from './routes/prediction.route.js';
import { AppError } from './utils/app-error.js';

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/doctors', recommendationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/predictions', predictionRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			message: err.message,
			details: err.details,
		});
		return;
	}

	console.error(err);
	res.status(500).json({
		message: 'Internal server error',
	});
});


export default app;