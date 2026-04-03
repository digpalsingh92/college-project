import express from 'express';
import authRoutes from './routes/auth.route.js';
import { AppError } from './utils/app-error.js';
const app = express();


app.use(express.json());
app.use('/api/auth', authRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			message: err.message,
			details: err.details,
		});
		return;
	}

	res.status(500).json({
		message: 'Internal server error',
	});
});


export default app;