import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './config/logger';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import doctorRoutes from './modules/doctors/doctor.routes';
import patientRoutes from './modules/patients/patient.routes';
import visitRoutes from './modules/visits/visit.routes';
import paymentRoutes from './modules/payments/payment.routes';
import prescriptionRoutes from './modules/prescriptions/prescription.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportRoutes from './modules/reports/report.routes';
import settingsRoutes from './modules/settings/setting.routes';
import queueRoutes from './modules/queue/queue.routes';
import clinicRoutes from './modules/clinics/clinic.routes';

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
}));
const corsOrigins = env.FRONTEND_URL ? [env.FRONTEND_URL] : [];
if (env.NODE_ENV === 'development') {
  corsOrigins.push('http://localhost:3000', 'http://localhost:3001');
}
app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/prescriptions', express.static(path.join(__dirname, '../prescriptions')));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/clinics', clinicRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;
