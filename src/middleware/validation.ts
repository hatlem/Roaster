// Input Validation and Sanitization Middleware
// Prevents injection attacks and ensures data integrity

import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Sanitize request data to prevent NoSQL injection
 * Note: We're using PostgreSQL, but this is good practice
 */
export const sanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
});

/**
 * Validate UUID parameters
 */
export function validateUUID(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      res.status(400).json({
        error: 'Invalid Parameter',
        message: `${paramName} must be a valid UUID`,
      });
      return;
    }

    next();
  };
}

/**
 * Validate date parameters
 */
export function validateDateParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dateStr = req.query[paramName] as string;

    if (!dateStr) {
      next();
      return;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      res.status(400).json({
        error: 'Invalid Parameter',
        message: `${paramName} must be a valid ISO 8601 date`,
      });
      return;
    }

    next();
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (page < 1) {
    res.status(400).json({
      error: 'Invalid Parameter',
      message: 'page must be >= 1',
    });
    return;
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({
      error: 'Invalid Parameter',
      message: 'limit must be between 1 and 100',
    });
    return;
  }

  // Attach validated values to request
  (req as any).pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };

  next();
}

/**
 * Strip sensitive fields from response
 */
export function stripSensitiveFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): Partial<T> {
  const stripped = { ...obj };
  fields.forEach((field) => delete stripped[field]);
  return stripped;
}
