import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import patientRoutes from './routes/patient.routes';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'patient' });
});

app.use('/api/v1/patient', patientRoutes);

export default app;
