import express from 'express';
import authRoutes from './routes/auth.route.js';
import doctorRoutes from './routes/schedule.route.js';
import appointmentRoutes from './routes/appointment.route.js';
import patientRoutes from './routes/patient.route.js';
import predictionRoutes from './routes/prediction.route.js';
import { AppError } from './utils/app-error.js';
import cors from "cors"
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
	origin: "http://localhost:3000",
}));
app.use(rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/patients', patientRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			status: false,
			statusCode: err.statusCode,
			message: err.message,
		});
		return;
	}

	console.error(err);
	res.status(500).json({
		status: false,
		statusCode: 500,
		message: 'Internal server error',
	});
});


export default app;