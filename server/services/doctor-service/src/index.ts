import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import doctorRoutes from './routes/doctorRoutes';
import prisma from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

prisma
  .$connect()
  .then(() => console.log('Doctor Service: PostgreSQL connected'))
  .catch((err) => console.error('PostgreSQL connection error:', err));

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

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
