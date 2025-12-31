// Zapier Integration Routes
// Manage webhook subscriptions for Zapier triggers

import { Router } from 'express';
import { z } from 'zod';
import { ZapierWebhookService, ZapierEventType } from '../services/zapierWebhookService';
import { authenticate, AuthRequest, canManageRosters } from '../middleware/auth';

const router = Router();
const zapierService = new ZapierWebhookService();

// Validation schemas
const subscribeSchema = z.object({
  webhookUrl: z.string().url(),
  events: z.array(z.string()).min(1),
});

const performListSchema = z.object({
  event: z.string().optional(),
});

/**
 * GET /api/zapier/events
 * List available event types for Zapier
 * Used by Zapier to populate trigger dropdown
 */
router.get('/events', (req, res) => {
  const events = zapierService.getAvailableEvents();
  return res.json(events);
});

/**
 * POST /api/zapier/subscribe
 * Subscribe a webhook URL to events
 * Called by Zapier when user creates a Zap
 */
router.post('/subscribe', authenticate, canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = subscribeSchema.parse(req.body);
    const organizationId = req.user!.organizationId || '';

    const subscription = await zapierService.createSubscription({
      organizationId,
      webhookUrl: data.webhookUrl,
      events: data.events as ZapierEventType[],
    });

    return res.json({
      id: subscription.id,
      message: 'Webhook subscription created',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Zapier subscribe error:', error);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * DELETE /api/zapier/subscribe/:subscriptionId
 * Unsubscribe a webhook
 * Called by Zapier when user deletes a Zap
 */
router.delete('/subscribe/:subscriptionId', authenticate, canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { subscriptionId } = req.params;
    await zapierService.deleteSubscription(subscriptionId);

    return res.json({
      message: 'Webhook subscription deleted',
    });
  } catch (error) {
    console.error('Zapier unsubscribe error:', error);
    return res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

/**
 * GET /api/zapier/subscriptions
 * List all webhook subscriptions for organization
 */
router.get('/subscriptions', authenticate, canManageRosters, async (req: AuthRequest, res) => {
  try {
    const organizationId = req.user!.organizationId || '';
    const subscriptions = await zapierService.getSubscriptions(organizationId);

    return res.json({
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        webhookUrl: s.webhookUrl,
        events: s.events,
        isActive: s.isActive,
        createdAt: s.createdAt,
      })),
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Zapier list subscriptions error:', error);
    return res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

/**
 * POST /api/zapier/test
 * Test a webhook URL
 * Used by Zapier to verify the webhook works
 */
router.post('/test', authenticate, async (req: AuthRequest, res) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }

    const result = await zapierService.testWebhook(webhookUrl);

    if (result.success) {
      return res.json({ success: true, message: 'Webhook test successful' });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Zapier test error:', error);
    return res.status(500).json({ error: 'Failed to test webhook' });
  }
});

/**
 * POST /api/zapier/perform-list
 * Return sample data for Zapier trigger setup
 * Zapier calls this to get example records
 */
router.post('/perform-list', authenticate, async (req: AuthRequest, res) => {
  try {
    const { event } = performListSchema.parse(req.body);

    // Return sample data based on event type
    const sampleData = getSampleDataForEvent(event as ZapierEventType);

    return res.json(sampleData);
  } catch (error) {
    console.error('Zapier perform-list error:', error);
    return res.status(500).json({ error: 'Failed to fetch sample data' });
  }
});

/**
 * POST /api/zapier/auth/test
 * Test authentication credentials
 * Called by Zapier to verify API key
 */
router.post('/auth/test', authenticate, async (req: AuthRequest, res) => {
  try {
    return res.json({
      authenticated: true,
      user: {
        id: req.user!.id,
        email: req.user!.email,
        organizationId: req.user!.organizationId,
      },
    });
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
});

/**
 * Get sample data for Zapier trigger setup
 */
function getSampleDataForEvent(event?: ZapierEventType): object[] {
  const baseData = {
    id: 'sample-id-12345',
    timestamp: new Date().toISOString(),
    organization: {
      id: 'org-sample-123',
      name: 'Sample Restaurant',
    },
  };

  switch (event) {
    case 'roster.published':
      return [{
        ...baseData,
        event: 'roster.published',
        data: {
          rosterId: 'roster-sample-123',
          rosterName: 'January 2025 Schedule',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          shiftsCount: 45,
          employeesCount: 12,
        },
      }];

    case 'shift.assigned':
      return [{
        ...baseData,
        event: 'shift.assigned',
        data: {
          shiftId: 'shift-sample-123',
          employeeId: 'emp-123',
          employeeName: 'Ola Nordmann',
          employeeEmail: 'ola@example.no',
          date: '2025-01-15',
          startTime: '2025-01-15T08:00:00Z',
          endTime: '2025-01-15T16:00:00Z',
          department: 'Kitchen',
          location: 'Downtown',
        },
      }];

    case 'marketplace.shift_available':
      return [{
        ...baseData,
        event: 'marketplace.shift_available',
        data: {
          listingId: 'listing-sample-123',
          shiftId: 'shift-sample-123',
          date: '2025-01-20',
          startTime: '2025-01-20T10:00:00Z',
          endTime: '2025-01-20T18:00:00Z',
          department: 'Service',
          reason: 'Employee sick leave',
          eligibleRoles: ['Server', 'Bartender'],
        },
      }];

    case 'swap.request_received':
      return [{
        ...baseData,
        event: 'swap.request_received',
        data: {
          swapId: 'swap-sample-123',
          requesterId: 'emp-123',
          requesterName: 'Ola Nordmann',
          requestedShiftDate: '2025-01-18',
          targetEmployeeId: 'emp-456',
          targetEmployeeName: 'Kari Hansen',
          offeredShiftDate: '2025-01-19',
          reason: 'Family commitment',
        },
      }];

    case 'timeoff.request_received':
      return [{
        ...baseData,
        event: 'timeoff.request_received',
        data: {
          requestId: 'timeoff-sample-123',
          employeeId: 'emp-123',
          employeeName: 'Ola Nordmann',
          type: 'VACATION',
          startDate: '2025-02-01',
          endDate: '2025-02-05',
          totalDays: 5,
          reason: 'Winter vacation',
        },
      }];

    case 'compliance.violation':
      return [{
        ...baseData,
        event: 'compliance.violation',
        data: {
          violationType: 'rest_period',
          employeeId: 'emp-123',
          employeeName: 'Ola Nordmann',
          shiftId: 'shift-sample-123',
          issue: 'Less than 11 hours rest between shifts',
          severity: 'warning',
          details: {
            restHours: 9.5,
            requiredHours: 11,
          },
        },
      }];

    default:
      return [{
        ...baseData,
        event: 'roster.published',
        data: {
          rosterId: 'roster-sample-123',
          rosterName: 'Sample Roster',
          message: 'This is sample data for testing your Zap',
        },
      }];
  }
}

export default router;
