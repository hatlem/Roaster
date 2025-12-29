// Shift Swap Routes
// Employee self-service for peer-to-peer shift swapping

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ShiftSwapService } from '../services/shiftSwapService';

const router = Router();
const swapService = new ShiftSwapService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createSwapRequestSchema = z.object({
  requestedShiftId: z.string().uuid(),
  targetEmployee: z.string().uuid().optional(),
  offeredShiftId: z.string().uuid().optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

const acceptSwapSchema = z.object({
  offeredShiftId: z.string().uuid().optional(),
});

const rejectSwapSchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

/**
 * POST /api/swaps/request
 * Create a swap request
 * Can be targeted at specific employee or open to all
 */
router.post('/request', async (req: AuthRequest, res) => {
  try {
    const data = createSwapRequestSchema.parse(req.body);

    // Validate that if targetEmployee is specified, it's not the requester
    if (data.targetEmployee && data.targetEmployee === req.user!.id) {
      return res.status(400).json({ error: 'Cannot swap shifts with yourself' });
    }

    const swapRequest = await swapService.requestSwap({
      ...data,
      requestedBy: req.user!.id,
      requestedByEmail: req.user!.email,
    });

    return res.status(201).json({
      swapRequest,
      message: data.targetEmployee
        ? 'Swap request sent to employee'
        : 'Swap request posted. Waiting for someone to accept.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to create swap request' });
  }
});

/**
 * GET /api/swaps/requests
 * Get swap requests created by the current user
 */
router.get('/requests', async (req: AuthRequest, res) => {
  try {
    const swapRequests = await swapService.getMySwapRequests(req.user!.id);
    return res.json({ swapRequests });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get swap requests' });
  }
});

/**
 * GET /api/swaps/incoming
 * Get swap requests targeting the current user (or open to all)
 */
router.get('/incoming', async (req: AuthRequest, res) => {
  try {
    const swapRequests = await swapService.getIncomingSwapRequests(req.user!.id);
    return res.json({ swapRequests });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get incoming swap requests' });
  }
});

/**
 * POST /api/swaps/:id/accept
 * Accept a swap request (target employee)
 */
router.post('/:id/accept', async (req: AuthRequest, res) => {
  try {
    const data = acceptSwapSchema.parse(req.body);

    const swapRequest = await swapService.acceptSwap({
      swapRequestId: req.params.id,
      userId: req.user!.id,
      userEmail: req.user!.email,
      offeredShiftId: data.offeredShiftId,
    });

    return res.json({
      swapRequest,
      message: 'Swap request accepted. Awaiting manager approval.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to accept swap request' });
  }
});

/**
 * POST /api/swaps/:id/reject
 * Reject a swap request (target employee)
 */
router.post('/:id/reject', async (req: AuthRequest, res) => {
  try {
    const data = rejectSwapSchema.parse(req.body);

    const swapRequest = await swapService.rejectSwap({
      swapRequestId: req.params.id,
      userId: req.user!.id,
      userEmail: req.user!.email,
      rejectionReason: data.rejectionReason,
    });

    return res.json({
      swapRequest,
      message: 'Swap request rejected',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to reject swap request' });
  }
});

/**
 * POST /api/swaps/:id/approve
 * Approve a swap request (manager only)
 */
router.post('/:id/approve', async (req: AuthRequest, res) => {
  try {
    // Check if user is manager or admin
    if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only managers can approve swap requests' });
    }

    const swapRequest = await swapService.approveSwap({
      swapRequestId: req.params.id,
      managerId: req.user!.id,
      managerEmail: req.user!.email,
    });

    return res.json({
      swapRequest,
      message: 'Swap request approved. Shifts have been swapped.',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to approve swap request' });
  }
});

/**
 * DELETE /api/swaps/:id
 * Cancel a swap request (requester only)
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const swapRequest = await swapService.cancelSwap({
      swapRequestId: req.params.id,
      userId: req.user!.id,
      userEmail: req.user!.email,
    });

    return res.json({
      swapRequest,
      message: 'Swap request cancelled',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to cancel swap request' });
  }
});

export default router;
