// Rate Limiting Middleware
// Prevents abuse and DDoS attacks

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked. Please try again in 15 minutes.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Rate limiter for report generation
 * 10 reports per hour per IP
 */
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many report requests, please try again later.',
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Report generation rate limit exceeded',
      message: 'You can generate up to 10 reports per hour. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Strict rate limiter for roster publishing
 * 20 publishes per hour per IP
 */
export const publishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many roster publications, please try again later.',
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Publish rate limit exceeded',
      message: 'You can publish up to 20 rosters per hour.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});
