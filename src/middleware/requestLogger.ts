// Request Logging Middleware with Correlation IDs
// Tracks requests for debugging and monitoring

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/requests.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export interface RequestWithId extends Request {
  correlationId?: string;
}

/**
 * Adds correlation ID to each request for tracing
 */
export function correlationIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  // Use client-provided ID or generate new one
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}

/**
 * Logs incoming requests with correlation ID
 */
export function requestLoggerMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Log request
  logger.info({
    type: 'request',
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info({
      type: 'response',
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.id,
    });
  });

  next();
}
