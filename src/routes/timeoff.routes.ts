// Time-Off Request Routes
// Vacation, sick leave, and other time-off management

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { TimeOffService } from '../services/timeOffService';

const router = Router();
const timeOffService = new TimeOffService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createTimeOffSchema = z.object({
  type: z.enum(['VACATION', 'SICK_LEAVE', 'PERSONAL', 'PARENTAL', 'BEREAVEMENT', 'UNPAID', 'OTHER']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  attachment: z.string().url().optional(),
});

const approveTimeOffSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().optional(),
});

/**
 * POST /api/timeoff/requests
 * Submit time-off request
 */
router.post('/requests', async (req: AuthRequest, res) => {
  try {
    const data = createTimeOffSchema.parse(req.body);

    const request = await timeOffService.submitTimeOffRequest({
      userId: req.user!.id,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
      attachment: data.attachment,
    });

    return res.status(201).json({
      request,
      message: 'Time-off request submitted successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to submit request' });
  }
});

/**
 * GET /api/timeoff/requests
 * Get user's time-off requests
 */
router.get('/requests', async (req: AuthRequest, res) => {
  try {
    const requests = await timeOffService.getUserTimeOffRequests(req.user!.id);
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get requests' });
  }
});

/**
 * GET /api/timeoff/requests/pending
 * Get pending requests (manager only)
 */
router.get('/requests/pending', async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only managers can view pending requests' });
    }

    const requests = await timeOffService.getPendingTimeOffRequests();
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get pending requests' });
  }
});

/**
 * POST /api/timeoff/requests/:id/approve
 * Approve or reject time-off request (manager only)
 */
router.post('/requests/:id/approve', async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only managers can approve requests' });
    }

    const { approve, rejectionReason } = approveTimeOffSchema.parse(req.body);

    let result;
    if (approve) {
      result = await timeOffService.approveTimeOffRequest(
        req.params.id,
        req.user!.id,
        req.user!.email
      );
    } else {
      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }
      result = await timeOffService.rejectTimeOffRequest(
        req.params.id,
        req.user!.id,
        req.user!.email,
        rejectionReason
      );
    }

    return res.json({
      request: result,
      message: approve ? 'Request approved' : 'Request rejected',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

/**
 * GET /api/timeoff/balance
 * Get accrual balances
 */
router.get('/balance', async (req: AuthRequest, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const balances = await timeOffService.getUserAccrualBalances(req.user!.id, year);

    return res.json({ balances });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get accrual balances' });
  }
});

/**
 * GET /api/timeoff/balance/:type
 * Get specific accrual balance
 */
router.get('/balance/:type', async (req: AuthRequest, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const balance = await timeOffService.getAccrualBalance(
      req.user!.id,
      req.params.type.toUpperCase(),
      year
    );

    return res.json({ balance });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get balance' });
  }
});

export default router;
