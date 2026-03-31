import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:4001';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:4002';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:4003';

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'gateway',
    services: {
      admin: ADMIN_SERVICE_URL,
      patient: PATIENT_SERVICE_URL,
      doctor: DOCTOR_SERVICE_URL,
    },
  });
});

app.use(
  '/api/v1/admin',
  createProxyMiddleware({
    target: ADMIN_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path: string) => `/api/v1/admin${path}`,
  })
);

app.use(
  '/api/v1/patient',
  createProxyMiddleware({
    target: PATIENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path: string) => `/api/v1/patient${path}`,
  })
);

app.use(
  '/api/v1/doctor',
  createProxyMiddleware({
    target: DOCTOR_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path: string) => `/api/v1/doctor${path}`,
  })
);

export default app;
