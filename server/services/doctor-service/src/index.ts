import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import doctorRoutes from './routes/doctorRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctor-service';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Doctor Service: MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'doctor-service', timestamp: new Date().toISOString() });
});

app.use('/api/doctors', doctorRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});

export default app;
