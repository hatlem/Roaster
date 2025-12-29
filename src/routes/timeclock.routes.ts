// Time Clock Routes
// Employee time tracking with clock in/out, breaks, and compliance monitoring

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, canManageRosters } from '../middleware/auth';
import { TimeClockService } from '../services/timeClockService';

const router = Router();
const timeClockService = new TimeClockService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const clockInSchema = z.object({
  userId: z.string().uuid().optional(), // For kiosk mode
  employeeNumber: z.string().optional(), // For kiosk mode by employee number
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
  kioskMode: z.boolean().optional(),
  kioskDeviceId: z.string().optional(),
});

const clockOutSchema = z.object({
  userId: z.string().uuid().optional(), // For kiosk mode
  employeeNumber: z.string().optional(), // For kiosk mode by employee number
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

const breakSchema = z.object({
  userId: z.string().uuid().optional(), // For kiosk mode
  employeeNumber: z.string().optional(), // For kiosk mode by employee number
});

const manualEntrySchema = z.object({
  userId: z.string().uuid(),
  date: z.string().datetime(),
  clockIn: z.string().datetime(),
  clockOut: z.string().datetime(),
  breakMinutes: z.number().min(0).max(720), // Max 12 hours of breaks
  notes: z.string().max(500).optional(),
});

const historySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  userId: z.string().uuid().optional(), // For managers viewing other employees
});

/**
 * Helper function to resolve user ID from request
 * Supports both regular mode (authenticated user) and kiosk mode (by userId or employeeNumber)
 */
async function resolveUserId(
  req: AuthRequest,
  data: { userId?: string; employeeNumber?: string }
): Promise<string> {
  // If userId provided (kiosk mode)
  if (data.userId) {
    // Only managers can clock in/out for other users
    if (data.userId !== req.user!.id) {
      if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
        throw new Error('Only managers can clock in/out for other employees');
      }
    }
    return data.userId;
  }

  // If employeeNumber provided (kiosk mode)
  if (data.employeeNumber) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { employeeNumber: data.employeeNumber },
    });
    if (!user) {
      throw new Error('Employee not found');
    }
    if (!user.isActive) {
      throw new Error('Employee account is not active');
    }
    return user.id;
  }

  // Default: use authenticated user
  return req.user!.id;
}

/**
 * POST /api/timeclock/clock-in
 * Clock in with optional location
 */
router.post('/clock-in', async (req: AuthRequest, res) => {
  try {
    const data = clockInSchema.parse(req.body);
    const userId = await resolveUserId(req, data);

    const result = await timeClockService.clockIn({
      userId,
      clockInTime: new Date(),
      location: data.location,
      notes: data.notes,
      kioskMode: data.kioskMode,
      kioskDeviceId: data.kioskDeviceId,
    });

    return res.status(201).json({
      success: true,
      message: 'Clocked in successfully',
      entry: result.entry,
      scheduledShift: result.scheduledShift,
      warnings: result.isLate
        ? [`You are ${result.minutesLate} minutes late for your scheduled shift`]
        : [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to clock in' });
  }
});

/**
 * POST /api/timeclock/clock-out
 * Clock out
 */
router.post('/clock-out', async (req: AuthRequest, res) => {
  try {
    const data = clockOutSchema.parse(req.body);
    const userId = await resolveUserId(req, data);

    const result = await timeClockService.clockOut({
      userId,
      clockOutTime: new Date(),
      location: data.location,
      notes: data.notes,
    });

    // Format compliance issues for response
    const warnings = result.complianceIssues
      .filter((i) => i.severity === 'WARNING')
      .map((i) => i.message);

    const violations = result.complianceIssues
      .filter((i) => i.severity === 'VIOLATION')
      .map((i) => i.message);

    if (result.isEarlyDeparture) {
      warnings.push(
        `You clocked out ${result.minutesEarly} minutes before your scheduled shift end`
      );
    }

    return res.json({
      success: true,
      message: 'Clocked out successfully',
      entry: result.entry,
      totalHours: result.totalHours,
      isOvertime: result.isOvertime,
      overtimeHours: result.overtimeHours,
      warnings,
      violations,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to clock out' });
  }
});

/**
 * POST /api/timeclock/break/start
 * Start break
 */
router.post('/break/start', async (req: AuthRequest, res) => {
  try {
    const data = breakSchema.parse(req.body);
    const userId = await resolveUserId(req, data);

    const result = await timeClockService.startBreak({
      userId,
      breakTime: new Date(),
      breakType: 'START',
    });

    return res.json({
      success: true,
      message: result.message,
      breakStartTime: result.breakStartTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to start break' });
  }
});

/**
 * POST /api/timeclock/break/end
 * End break
 */
router.post('/break/end', async (req: AuthRequest, res) => {
  try {
    const data = breakSchema.parse(req.body);
    const userId = await resolveUserId(req, data);

    const result = await timeClockService.endBreak({
      userId,
      breakTime: new Date(),
      breakType: 'END',
    });

    return res.json({
      success: true,
      message: result.message,
      breakEndTime: result.breakEndTime,
      breakDuration: result.breakDuration,
      totalBreakMinutes: result.totalBreakMinutes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to end break' });
  }
});

/**
 * GET /api/timeclock/status
 * Get current clock status for authenticated user or specified user (manager only)
 */
router.get('/status', async (req: AuthRequest, res) => {
  try {
    let userId = req.user!.id;

    // If userId query param provided, verify permissions
    if (req.query.userId) {
      const requestedUserId = req.query.userId as string;
      if (requestedUserId !== req.user!.id) {
        if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
          return res
            .status(403)
            .json({ error: 'Only managers can view status for other employees' });
        }
      }
      userId = requestedUserId;
    }

    const status = await timeClockService.getStatus(userId);

    return res.json({
      success: true,
      status,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * GET /api/timeclock/history
 * Get time entries for date range
 */
router.get('/history', async (req: AuthRequest, res) => {
  try {
    const data = historySchema.parse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
    });

    let userId = req.user!.id;

    // If userId provided, verify permissions
    if (data.userId) {
      if (data.userId !== req.user!.id) {
        if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
          return res
            .status(403)
            .json({ error: 'Only managers can view history for other employees' });
        }
      }
      userId = data.userId;
    }

    const entries = await timeClockService.getHistory(
      userId,
      new Date(data.startDate),
      new Date(data.endDate)
    );

    // Get overtime summary
    const summary = await timeClockService.getOvertimeSummary(
      userId,
      new Date(data.startDate),
      new Date(data.endDate)
    );

    return res.json({
      success: true,
      entries,
      summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to get history' });
  }
});

/**
 * POST /api/timeclock/manual-entry
 * Create manual time entry (manager only)
 */
router.post('/manual-entry', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = manualEntrySchema.parse(req.body);

    const entry = await timeClockService.createManualEntry({
      userId: data.userId,
      date: new Date(data.date),
      clockIn: new Date(data.clockIn),
      clockOut: new Date(data.clockOut),
      breakMinutes: data.breakMinutes,
      notes: data.notes,
      createdBy: req.user!.id,
      createdByEmail: req.user!.email,
    });

    return res.status(201).json({
      success: true,
      message: 'Manual time entry created successfully',
      entry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to create manual entry' });
  }
});

/**
 * GET /api/timeclock/today
 * Get today's time entries for all employees (manager only)
 */
router.get('/today', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const entries = await timeClockService.getTodayEntries(true);

    // Calculate summary statistics
    const totalEmployees = entries.length;
    const clockedIn = entries.filter((e) => !e.clockOut).length;
    const onBreak = entries.filter((e) => e.status.isOnBreak).length;
    const lateArrivals = entries.filter((e) => e.status.isLate).length;
    const complianceIssues = entries.filter((e) => e.status.complianceIssues.length > 0).length;

    return res.json({
      success: true,
      entries,
      summary: {
        totalEmployees,
        clockedIn,
        onBreak,
        lateArrivals,
        complianceIssues,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to get today entries' });
  }
});

/**
 * GET /api/timeclock/overtime-summary
 * Get overtime summary for user in a period
 */
router.get('/overtime-summary', async (req: AuthRequest, res) => {
  try {
    const data = historySchema.parse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
    });

    let userId = req.user!.id;

    // If userId provided, verify permissions
    if (data.userId) {
      if (data.userId !== req.user!.id) {
        if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
          return res
            .status(403)
            .json({ error: 'Only managers can view overtime for other employees' });
        }
      }
      userId = data.userId;
    }

    const summary = await timeClockService.getOvertimeSummary(
      userId,
      new Date(data.startDate),
      new Date(data.endDate)
    );

    return res.json({
      success: true,
      summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to get overtime summary' });
  }
});

export default router;
