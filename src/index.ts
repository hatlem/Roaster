// Production-Ready Express Server
// Norwegian Labor Law Compliant Roster SaaS

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import winston from 'winston';

// Import middleware
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { correlationIdMiddleware, requestLoggerMiddleware } from './middleware/requestLogger';
import { metricsMiddleware, metricsHandler } from './middleware/metrics';
import { sanitizeMiddleware } from './middleware/validation';

// Import routes
import authRoutes from './routes/auth.routes';
import rosterRoutes from './routes/roster.routes';
import employeeRoutes from './routes/employee.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import timeoffRoutes from './routes/timeoff.routes';
import dashboardRoutes from './routes/dashboard.routes';
import communicationRoutes from './routes/communication.routes';
import swapRoutes from './routes/swap.routes';
import timeclockRoutes from './routes/timeclock.routes';
import reportsRoutes from './routes/reports.routes';
import integrationsRoutes from './routes/integrations.routes';
import zapierRoutes from './routes/zapier.routes';
import { consensusRoutes } from './routes/consensus.routes';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitization
app.use(sanitizeMiddleware);

// Request tracking
app.use(correlationIdMiddleware);
app.use(requestLoggerMiddleware);

// Metrics collection
app.use(metricsMiddleware);

// Serve static marketing pages from public directory
app.use(express.static('public'));

// Global rate limiting
app.use('/api/', apiLimiter);

// Health check endpoint (before rate limiting for monitoring)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'roster-saas',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'roster-saas',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: 'ok',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'error',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', metricsHandler);

// Readiness probe (Kubernetes)
app.get('/ready', (req, res) => {
  res.status(200).send('OK');
});

// Liveness probe (Kubernetes)
app.get('/live', (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/timeoff', timeoffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/timeclock', timeclockRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/zapier', zapierRoutes);
app.use('/api/consensus', consensusRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handler
let server: any;

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} signal received: starting graceful shutdown`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  // Close database connections
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.$disconnect();

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`🚀 Roster SaaS server running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`✅ Norwegian Labor Law Compliance: ENABLED`);
    logger.info(`   - 14-Day Rule: Active`);
    logger.info(`   - Rest Period Validation: 11h/35h`);
    logger.info(`   - Working Hours Limits: 9h/40h`);
    logger.info(`   - Overtime Tracking: 10h/25h/200h`);
    logger.info(`   - Audit Logging: ${process.env.AUDIT_RETENTION_YEARS || 2} years`);
    logger.info(`📈 Metrics available at: http://localhost:${PORT}/metrics`);
    logger.info(`🏥 Health check at: http://localhost:${PORT}/health`);
  });

  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
    } else {
      logger.error('Server error:', error);
    }
    process.exit(1);
  });
}

export default app;
