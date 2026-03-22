import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Core middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ── Service URLs ──────────────────────────────────────────────────────────────
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
const ADMIN_SERVICE_URL   = process.env.ADMIN_SERVICE_URL   || 'http://localhost:3002';
const DOCTOR_SERVICE_URL  = process.env.DOCTOR_SERVICE_URL  || 'http://localhost:3003';
const AI_SERVICE_URL      = process.env.AI_SERVICE_URL      || 'http://localhost:5000';

// ── Public routes (no auth required) ─────────────────────────────────────────
app.use('/api/patients/auth', createProxyMiddleware({ target: PATIENT_SERVICE_URL, changeOrigin: true }));
app.use('/api/doctors/auth',  createProxyMiddleware({ target: DOCTOR_SERVICE_URL,  changeOrigin: true }));
app.use('/api/admin/auth',    createProxyMiddleware({ target: ADMIN_SERVICE_URL,   changeOrigin: true }));

// ── Protected routes ──────────────────────────────────────────────────────────
app.use('/api/patients', authMiddleware, createProxyMiddleware({ target: PATIENT_SERVICE_URL, changeOrigin: true }));
app.use('/api/admin',    authMiddleware, createProxyMiddleware({ target: ADMIN_SERVICE_URL,   changeOrigin: true }));
app.use('/api/doctors',  authMiddleware, createProxyMiddleware({ target: DOCTOR_SERVICE_URL,  changeOrigin: true }));
app.use('/api/ai',       authMiddleware, createProxyMiddleware({ target: AI_SERVICE_URL,      changeOrigin: true }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export default app;
