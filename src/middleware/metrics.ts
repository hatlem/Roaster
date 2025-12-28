// Prometheus Metrics Middleware
// Exposes metrics for monitoring and alerting

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
});

const complianceViolations = new client.Counter({
  name: 'roster_compliance_violations_total',
  help: 'Total number of compliance violations detected',
  labelNames: ['violation_type'],
});

const rostersPublished = new client.Counter({
  name: 'rosters_published_total',
  help: 'Total number of rosters published',
  labelNames: ['is_late'],
});

const shiftsCreated = new client.Counter({
  name: 'shifts_created_total',
  help: 'Total number of shifts created',
  labelNames: ['has_violations'],
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(complianceViolations);
register.registerMetric(rostersPublished);
register.registerMetric(shiftsCreated);

/**
 * Metrics collection middleware
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode.toString();

    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    activeConnections.dec();
  });

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

/**
 * Track compliance violations
 */
export function trackComplianceViolation(violationType: string): void {
  complianceViolations.inc({ violation_type: violationType });
}

/**
 * Track roster publication
 */
export function trackRosterPublished(isLate: boolean): void {
  rostersPublished.inc({ is_late: isLate.toString() });
}

/**
 * Track shift creation
 */
export function trackShiftCreated(hasViolations: boolean): void {
  shiftsCreated.inc({ has_violations: hasViolations.toString() });
}

export { register };
