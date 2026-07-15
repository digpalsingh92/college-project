import express from 'express';
import { authRouter, patientRouter } from './modules/users/users.routes.js';
import doctorRouter from './modules/doctors/doctors.routes.js';
import appointmentRouter from './modules/appointments/appointments.routes.js';
import predictionRouter from './modules/predictions/predictions.routes.js';
import assistantRouter from './modules/assistant/assistant.routes.js';
import resourceRouter from './modules/resources/resources.routes.js';
import { AppError } from './utils/app-error.js';
import cors from "cors"
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';

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

app.use('/api/auth', authRouter);
app.use('/api/doctors', doctorRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/predictions', predictionRouter);
app.use('/api/patients', patientRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/resources', resourceRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			status: false,
			statusCode: err.statusCode,
			message: err.message,
		});
		return;
	}

	if (err instanceof ZodError) {
		const zodErr = err as any;
		res.status(400).json({
			status: false,
			statusCode: 400,
			message: 'Validation failed: ' + zodErr.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
			errors: zodErr.errors,
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