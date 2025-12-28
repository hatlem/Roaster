// Dashboard & Analytics Routes
// Real-time metrics and KPIs for management

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, canManageRosters } from '../middleware/auth';
import { DashboardService } from '../services/dashboardService';

const router = Router();
const dashboardService = new DashboardService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics for a date range
 */
router.get('/metrics', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const organizationId = req.query.organizationId as string;
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const metrics = await dashboardService.getDashboardMetrics(
      organizationId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return res.json({ metrics });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * GET /api/dashboard/weekly-comparison
 * Get week-over-week comparison
 */
router.get('/weekly-comparison', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { date, organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const targetDate = date ? new Date(date as string) : new Date();

    const comparison = await dashboardService.getWeeklyComparison(
      organizationId as string,
      targetDate
    );

    return res.json({ comparison });
  } catch (error) {
    console.error('Weekly comparison error:', error);
    return res.status(500).json({ error: 'Failed to get comparison' });
  }
});

/**
 * GET /api/dashboard/summary
 * Get quick summary for homepage
 */
router.get('/summary', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    // Get current week metrics
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday

    const metrics = await dashboardService.getDashboardMetrics(
      organizationId,
      weekStart,
      weekEnd
    );

    // Quick summary
    const summary = {
      currentWeek: {
        complianceRate: metrics.compliance.complianceRate,
        laborCost: metrics.labor.scheduledCost,
        budgetVariance: metrics.labor.variancePercentage,
        attendanceRate: metrics.attendance.attendanceRate,
      },
      alerts: {
        violations: metrics.compliance.shiftsWithViolations,
        latePublications: metrics.compliance.latePublications,
        overBudget: metrics.labor.variance > 0,
      },
    };

    return res.json({ summary });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Failed to get summary' });
  }
});

export default router;
