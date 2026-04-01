import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import doctorRoutes from './routes/auth.route';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app = express();
const openApiPath = path.resolve(__dirname, '../swagger.yaml');
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'doctor' });
});

app.get('/docs/openapi.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/v1/doctor', doctorRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
