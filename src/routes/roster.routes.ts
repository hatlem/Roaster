// Roster Management Routes
// Complete CRUD for rosters with compliance validation

import { Router } from 'express';
import { z } from 'zod';
import { RosterService } from '../services/rosterService';
import { ComplianceReportGenerator } from '../services/complianceReportGenerator';
import { NotificationService } from '../services/notificationService';
import { authenticate, AuthRequest, canManageRosters, isRepresentative } from '../middleware/auth';
import { ChangeReason, RosterStatus } from '@prisma/client';

const router = Router();
const rosterService = new RosterService();
const reportGenerator = new ComplianceReportGenerator();
const notificationService = new NotificationService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createRosterSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const addShiftSchema = z.object({
  userId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  breakMinutes: z.number().min(0).default(0),
  department: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const modifyShiftSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.nativeEnum(ChangeReason),
  changeNotes: z.string().min(1),
});

/**
 * POST /api/rosters
 * Create a new roster (MANAGER/ADMIN only)
 */
router.post('/', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = createRosterSchema.parse(req.body);

    const roster = await rosterService.createRoster(
      data.organizationId,
      data.name,
      new Date(data.startDate),
      new Date(data.endDate),
      req.user!.id,
      req.user!.email
    );

    return res.status(201).json({ roster });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create roster error:', error);
    return res.status(500).json({ error: 'Failed to create roster' });
  }
});

/**
 * GET /api/rosters/:id
 * Get roster with validation status
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await rosterService.getRosterWithValidation(req.params.id);
    return res.json(result);
  } catch (error) {
    console.error('Get roster error:', error);
    return res.status(500).json({ error: 'Failed to retrieve roster' });
  }
});

/**
 * POST /api/rosters/:id/shifts
 * Add a shift to a roster (MANAGER/ADMIN only)
 */
router.post('/:id/shifts', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = addShiftSchema.parse(req.body);

    const result = await rosterService.addShift(
      req.params.id,
      data.userId,
      new Date(data.startTime),
      new Date(data.endTime),
      data.breakMinutes,
      data.department,
      data.location,
      data.notes,
      req.user!.id,
      req.user!.email
    );

    // Send notification if shift is valid
    if (result.validation.isValid) {
      await notificationService.notifyShiftAssigned(data.userId, result.shift);
    }

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Add shift error:', error);
    return res.status(500).json({ error: 'Failed to add shift' });
  }
});

/**
 * POST /api/rosters/:id/publish
 * Publish a roster (implements 14-day rule)
 */
router.post('/:id/publish', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const result = await rosterService.publishRoster(
      req.params.id,
      req.user!.id,
      req.user!.email
    );

    // Notify all employees
    if (result.roster.shifts) {
      await notificationService.notifyAllEmployeesRosterPublished(
        result.roster.shifts,
        result.roster.name,
        result.roster.id
      );
    }

    return res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Publish roster error:', error);
    return res.status(500).json({ error: 'Failed to publish roster' });
  }
});

/**
 * POST /api/rosters/:id/review
 * Send roster for review by employee representative
 */
router.post('/:id/review', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const roster = await rosterService.sendForReview(
      req.params.id,
      req.user!.id,
      req.user!.email
    );

    return res.json({ roster });
  } catch (error) {
    console.error('Send for review error:', error);
    return res.status(500).json({ error: 'Failed to send for review' });
  }
});

/**
 * POST /api/rosters/:id/approve
 * Approve roster (REPRESENTATIVE only)
 */
router.post('/:id/approve', isRepresentative, async (req: AuthRequest, res) => {
  try {
    const { comments } = req.body;

    const roster = await rosterService.approveRoster(
      req.params.id,
      req.user!.id,
      req.user!.email,
      comments
    );

    return res.json({ roster });
  } catch (error) {
    console.error('Approve roster error:', error);
    return res.status(500).json({ error: 'Failed to approve roster' });
  }
});

/**
 * PATCH /api/shifts/:id
 * Modify a published shift (requires reason)
 */
router.patch('/shifts/:id', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = modifyShiftSchema.parse(req.body);

    const result = await rosterService.modifyPublishedShift(
      req.params.id,
      new Date(data.startTime),
      new Date(data.endTime),
      data.reason,
      data.changeNotes,
      req.user!.id,
      req.user!.email
    );

    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Modify shift error:', error);
    return res.status(500).json({ error: 'Failed to modify shift' });
  }
});

/**
 * GET /api/rosters/organization/:orgId/compliance-report
 * Generate compliance report for Arbeidstilsynet
 */
router.get('/organization/:orgId/compliance-report', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const report = await reportGenerator.generateArbeidstilsynetReport(
      req.params.orgId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    // Save report
    const reportId = await reportGenerator.saveReport(
      req.params.orgId,
      report,
      req.user!.id
    );

    return res.json({
      reportId,
      report,
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/rosters/organization/:orgId/compliance-report/export
 * Export compliance report as CSV or JSON
 */
router.get('/organization/:orgId/compliance-report/export', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const report = await reportGenerator.generateArbeidstilsynetReport(
      req.params.orgId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    if (format === 'csv') {
      const csv = reportGenerator.exportAsCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="arbeidstilsynet-report-${report.periodStart}-${report.periodEnd}.csv"`);
      return res.send(csv);
    } else {
      const json = reportGenerator.exportAsJSON(report);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="arbeidstilsynet-report-${report.periodStart}-${report.periodEnd}.json"`);
      return res.send(json);
    }
  } catch (error) {
    console.error('Export report error:', error);
    return res.status(500).json({ error: 'Failed to export report' });
  }
});

export default router;
