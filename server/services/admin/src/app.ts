import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'admin' });
});

app.use('/api/v1/admin', adminRoutes);

export default app;
