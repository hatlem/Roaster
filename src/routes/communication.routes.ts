// Team Communication Routes
// Routes for direct messaging and broadcasts

import { Router } from 'express';
import { z } from 'zod';
import { TeamCommunicationService } from '../services/teamCommunicationService';
import { authenticate, AuthRequest, canManageRosters } from '../middleware/auth';

const router = Router();
const communicationService = new TeamCommunicationService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  rosterId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

const sendBroadcastSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  audience: z.enum(['ALL', 'DEPARTMENT', 'ROSTER']),
  departmentId: z.string().optional(),
  rosterId: z.string().uuid().optional(),
});

const getMessagesQuerySchema = z.object({
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  unreadOnly: z.string().transform(val => val === 'true').optional(),
  rosterId: z.string().uuid().optional(),
});

const getBroadcastsQuerySchema = z.object({
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  sentByUser: z.string().transform(val => val === 'true').optional(),
});

/**
 * POST /api/communication/messages
 * Send a direct message to another employee
 */
router.post('/messages', async (req: AuthRequest, res) => {
  try {
    const data = sendMessageSchema.parse(req.body);

    // Prevent sending messages to yourself
    if (data.recipientId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const message = await communicationService.sendMessage(
      req.user!.id,
      data.recipientId,
      data.content,
      data.rosterId,
      data.parentId,
      req.user!.email
    );

    return res.status(201).json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * GET /api/communication/messages
 * Get messages for the authenticated user
 */
router.get('/messages', async (req: AuthRequest, res) => {
  try {
    const query = getMessagesQuerySchema.parse(req.query);

    const result = await communicationService.getUserMessages(req.user!.id, {
      limit: query.limit,
      offset: query.offset,
      unreadOnly: query.unreadOnly,
      rosterId: query.rosterId,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

/**
 * GET /api/communication/messages/:id
 * Get a single message with its thread (all replies)
 */
router.get('/messages/:id', async (req: AuthRequest, res) => {
  try {
    const message = await communicationService.getMessageWithThread(
      req.params.id,
      req.user!.id
    );

    return res.json({ message });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Message not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Unauthorized access to message') {
        return res.status(403).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
    console.error('Get message error:', error);
    return res.status(500).json({ error: 'Failed to retrieve message' });
  }
});

/**
 * POST /api/communication/messages/:id/read
 * Mark a message as read
 */
router.post('/messages/:id/read', async (req: AuthRequest, res) => {
  try {
    const message = await communicationService.markAsRead(
      req.params.id,
      req.user!.id,
      req.user!.email
    );

    return res.json({ message });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Message not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only the recipient can mark a message as read') {
        return res.status(403).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
    console.error('Mark as read error:', error);
    return res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * DELETE /api/communication/messages/:id
 * Delete a message (only sender can delete)
 */
router.delete('/messages/:id', async (req: AuthRequest, res) => {
  try {
    await communicationService.deleteMessage(
      req.params.id,
      req.user!.id,
      req.user!.email
    );

    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Message not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only the sender can delete a message') {
        return res.status(403).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
    console.error('Delete message error:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
});

/**
 * GET /api/communication/unread-count
 * Get the count of unread messages for the authenticated user
 */
router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const count = await communicationService.getUnreadCount(req.user!.id);

    return res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ error: 'Failed to retrieve unread count' });
  }
});

/**
 * POST /api/communication/broadcast
 * Send a broadcast message (MANAGER/ADMIN only)
 */
router.post('/broadcast', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = sendBroadcastSchema.parse(req.body);

    // Validate audience-specific requirements
    if (data.audience === 'ROSTER' && !data.rosterId) {
      return res.status(400).json({ error: 'Roster ID is required for roster broadcasts' });
    }

    if (data.audience === 'DEPARTMENT' && !data.departmentId) {
      return res.status(400).json({ error: 'Department ID is required for department broadcasts' });
    }

    const broadcast = await communicationService.sendBroadcast(
      req.user!.id,
      data.title,
      data.content,
      data.audience,
      {
        departmentId: data.departmentId,
        rosterId: data.rosterId,
      },
      req.user!.email
    );

    return res.status(201).json({ broadcast });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Send broadcast error:', error);
    return res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

/**
 * GET /api/communication/broadcasts
 * Get broadcasts for the authenticated user
 */
router.get('/broadcasts', async (req: AuthRequest, res) => {
  try {
    const query = getBroadcastsQuerySchema.parse(req.query);

    const result = await communicationService.getBroadcasts(req.user!.id, {
      limit: query.limit,
      offset: query.offset,
      sentByUser: query.sentByUser,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    console.error('Get broadcasts error:', error);
    return res.status(500).json({ error: 'Failed to retrieve broadcasts' });
  }
});

/**
 * GET /api/communication/rosters/:rosterId/announcements
 * Get all announcements for a specific roster
 */
router.get('/rosters/:rosterId/announcements', async (req: AuthRequest, res) => {
  try {
    const announcements = await communicationService.getRosterAnnouncements(req.params.rosterId);

    return res.json({ announcements });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Roster not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
    console.error('Get roster announcements error:', error);
    return res.status(500).json({ error: 'Failed to retrieve roster announcements' });
  }
});

export default router;
