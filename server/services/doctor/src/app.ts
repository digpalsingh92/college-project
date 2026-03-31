import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import doctorRoutes from './routes/doctor.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'doctor' });
});

app.use('/api/v1/doctor', doctorRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
