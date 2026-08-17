import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import busRoutes from './routes/bus.routes';
import driverRoutes from './routes/driver.routes';
import routeRoutes from './routes/route.routes';
import stopRoutes from './routes/stop.routes';
import depotRoutes from './routes/depot.routes';
import tripRoutes from './routes/trip.routes';
import scheduleRoutes from './routes/schedule.routes';
import dashboardRoutes from './routes/dashboard.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import fuelRoutes from './routes/fuel.routes';
import attendanceRoutes from './routes/attendance.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import passengerRoutes from './routes/passenger.routes';
import analyticsRoutes from './routes/analytics.routes';
import telemetryRoutes from './routes/telemetry.routes';
import boardingRoutes from './routes/boarding.routes';
import studentRoutes from './routes/student.routes';
import safetyRoutes from './routes/safety.routes';
import mediaRoutes from './routes/media.routes';

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => req.path.startsWith('/telemetry') || req.path.startsWith('/health'),
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
const morganStream = { write: (message: string) => logger.info(message.trim()) };
app.use(morgan('combined', { stream: morganStream }));

// Static files with CORS and media streaming support
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Accept-Ranges', 'bytes');
  next();
}, express.static('uploads'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.env });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/depots', depotRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/passenger', passengerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/boarding', boardingRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/media', mediaRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
