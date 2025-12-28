// Employee Portal Routes
// Routes for employees to view their schedules and manage preferences

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();
const prisma = new PrismaClient();
const notificationService = new NotificationService();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/employee/shifts
 * Get employee's own shifts
 */
router.get('/shifts', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        roster: {
          select: {
            name: true,
            status: true,
            publishedAt: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return res.json({ shifts });
  } catch (error) {
    console.error('Get shifts error:', error);
    return res.status(500).json({ error: 'Failed to retrieve shifts' });
  }
});

/**
 * GET /api/employee/rosters
 * Get published rosters that include the employee
 */
router.get('/rosters', async (req: AuthRequest, res) => {
  try {
    const rosters = await prisma.roster.findMany({
      where: {
        status: { in: ['PUBLISHED', 'ACTIVE', 'COMPLETED'] },
        shifts: {
          some: {
            userId: req.user!.id,
          },
        },
      },
      include: {
        shifts: {
          where: {
            userId: req.user!.id,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return res.json({ rosters });
  } catch (error) {
    console.error('Get rosters error:', error);
    return res.status(500).json({ error: 'Failed to retrieve rosters' });
  }
});

/**
 * GET /api/employee/preferences
 * Get employee's scheduling preferences
 */
router.get('/preferences', async (req: AuthRequest, res) => {
  try {
    const preferences = await prisma.employeePreference.findMany({
      where: {
        userId: req.user!.id,
      },
    });

    return res.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    return res.status(500).json({ error: 'Failed to retrieve preferences' });
  }
});

/**
 * POST /api/employee/preferences
 * Create or update scheduling preferences
 */
router.post('/preferences', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      preferredDays: z.array(z.string()).optional(),
      avoidDays: z.array(z.string()).optional(),
      preferMorning: z.boolean().optional(),
      preferEvening: z.boolean().optional(),
      preferNight: z.boolean().optional(),
      maxHoursPerWeek: z.number().optional(),
      minHoursPerWeek: z.number().optional(),
      unavailableFrom: z.string().datetime().optional(),
      unavailableTo: z.string().datetime().optional(),
      unavailableReason: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const preference = await prisma.employeePreference.create({
      data: {
        userId: req.user!.id,
        ...data,
        unavailableFrom: data.unavailableFrom ? new Date(data.unavailableFrom) : undefined,
        unavailableTo: data.unavailableTo ? new Date(data.unavailableTo) : undefined,
      },
    });

    return res.status(201).json({ preference });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create preference error:', error);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
});

/**
 * GET /api/employee/notifications
 * Get employee's notifications
 */
router.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const notifications = await notificationService.getUnreadNotifications(req.user!.id);
    return res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

/**
 * POST /api/employee/notifications/:id/read
 * Mark notification as read
 */
router.post('/notifications/:id/read', async (req: AuthRequest, res) => {
  try {
    await notificationService.markAsRead(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/employee/notifications/read-all
 * Mark all notifications as read
 */
router.post('/notifications/read-all', async (req: AuthRequest, res) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * GET /api/employee/hours-summary
 * Get summary of hours worked (for employee's own records)
 */
router.get('/hours-summary', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const actualHours = await prisma.actualHours.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });

    const totalHours = actualHours.reduce((sum, ah) => sum + ah.totalHours, 0);
    const totalOvertimeHours = actualHours.reduce((sum, ah) => sum + ah.overtimeHours, 0);

    return res.json({
      actualHours,
      summary: {
        totalHours,
        totalOvertimeHours,
        totalDays: actualHours.length,
      },
    });
  } catch (error) {
    console.error('Get hours summary error:', error);
    return res.status(500).json({ error: 'Failed to retrieve hours summary' });
  }
});

export default router;
