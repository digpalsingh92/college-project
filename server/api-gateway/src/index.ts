import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { authorizeRoles } from './middleware/authorize';
import { swaggerSpec } from './swagger';

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

app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Service URLs ──────────────────────────────────────────────────────────────
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
const ADMIN_SERVICE_URL   = process.env.ADMIN_SERVICE_URL   || 'http://localhost:3002';
const DOCTOR_SERVICE_URL  = process.env.DOCTOR_SERVICE_URL  || 'http://localhost:3003';
const AI_SERVICE_URL      = process.env.AI_SERVICE_URL      || 'http://localhost:5000';

const proxyOptions = (target: string) => ({
  target,
  changeOrigin: true,
  onProxyReq: fixRequestBody,
});

// ── Public routes (no auth required) ─────────────────────────────────────────
app.use('/api/patients/auth', createProxyMiddleware(proxyOptions(PATIENT_SERVICE_URL)));
app.use('/api/doctors/auth/login', createProxyMiddleware(proxyOptions(DOCTOR_SERVICE_URL)));
app.use('/api/admin/auth',    createProxyMiddleware(proxyOptions(ADMIN_SERVICE_URL)));

// ── Protected routes ──────────────────────────────────────────────────────────
app.use('/api/doctors/auth/register', authMiddleware, authorizeRoles('admin', 'superadmin'), createProxyMiddleware(proxyOptions(DOCTOR_SERVICE_URL)));
app.use('/api/patients', authMiddleware, authorizeRoles('patient', 'admin', 'superadmin'), createProxyMiddleware(proxyOptions(PATIENT_SERVICE_URL)));
app.use('/api/admin',    authMiddleware, authorizeRoles('admin', 'superadmin'), createProxyMiddleware(proxyOptions(ADMIN_SERVICE_URL)));
app.use('/api/doctors',  authMiddleware, authorizeRoles('doctor', 'admin', 'superadmin'), createProxyMiddleware(proxyOptions(DOCTOR_SERVICE_URL)));
app.use('/api/ai',       authMiddleware, createProxyMiddleware(proxyOptions(AI_SERVICE_URL)));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export default app;
