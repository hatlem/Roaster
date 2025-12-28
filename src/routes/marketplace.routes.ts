// Shift Marketplace Routes
// Employee self-service for claiming and swapping shifts

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ShiftMarketplaceService } from '../services/shiftMarketplaceService';

const router = Router();
const marketplaceService = new ShiftMarketplaceService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const postShiftSchema = z.object({
  shiftId: z.string().uuid(),
  availableUntil: z.string().datetime(),
  reason: z.string().optional(),
  eligibleRoles: z.array(z.string()).optional(),
  eligibleUserIds: z.array(z.string().uuid()).optional(),
});

/**
 * POST /api/marketplace/shifts
 * Post a shift to marketplace
 */
router.post('/shifts', async (req: AuthRequest, res) => {
  try {
    const data = postShiftSchema.parse(req.body);

    const listing = await marketplaceService.postShiftToMarketplace({
      ...data,
      postedBy: req.user!.id,
      availableUntil: new Date(data.availableUntil),
    });

    return res.status(201).json({ listing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to post shift' });
  }
});

/**
 * GET /api/marketplace/shifts
 * Get available shifts
 */
router.get('/shifts', async (req: AuthRequest, res) => {
  try {
    const listings = await marketplaceService.getAvailableShifts(req.user!.id);
    return res.json({ listings });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get available shifts' });
  }
});

/**
 * POST /api/marketplace/shifts/:id/claim
 * Claim a shift
 */
router.post('/shifts/:id/claim', async (req: AuthRequest, res) => {
  try {
    const listing = await marketplaceService.claimShift(
      req.params.id,
      req.user!.id,
      req.user!.email
    );

    return res.json({
      listing,
      message: 'Shift claimed successfully. Awaiting manager approval.',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to claim shift' });
  }
});

/**
 * POST /api/marketplace/shifts/:id/approve
 * Approve a shift claim (manager only)
 */
router.post('/shifts/:id/approve', async (req: AuthRequest, res) => {
  try {
    // Check if user is manager or admin
    if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only managers can approve shift claims' });
    }

    const listing = await marketplaceService.approveShiftClaim(
      req.params.id,
      req.user!.id,
      req.user!.email
    );

    return res.json({
      listing,
      message: 'Shift claim approved',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to approve shift claim' });
  }
});

/**
 * DELETE /api/marketplace/shifts/:id
 * Cancel marketplace listing
 */
router.delete('/shifts/:id', async (req: AuthRequest, res) => {
  try {
    const listing = await marketplaceService.cancelListing(
      req.params.id,
      req.user!.id,
      req.user!.email
    );

    return res.json({ listing, message: 'Listing cancelled' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to cancel listing' });
  }
});

export default router;
