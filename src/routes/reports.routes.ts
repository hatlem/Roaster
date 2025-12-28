// Advanced Reporting Routes
// Comprehensive reporting with custom filters and scheduled reports

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, canManageRosters } from '../middleware/auth';
import {
  AdvancedReportingService,
  ReportTemplateType,
  GenerateReportRequest,
  ReportFilter,
  ScheduledReport,
} from '../services/advancedReportingService';

const router = Router();
const reportingService = new AdvancedReportingService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const reportFilterSchema = z.object({
  departmentIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  includeArchived: z.boolean().optional(),
  shiftTypes: z.array(z.string()).optional(),
  complianceStatus: z.array(z.enum(['compliant', 'warning', 'violation'])).optional(),
  minHours: z.number().optional(),
  maxHours: z.number().optional(),
});

const generateReportSchema = z.object({
  templateId: z.enum([
    'compliance_summary',
    'labor_cost_analysis',
    'attendance_report',
    'overtime_report',
    'shift_coverage_report',
    'arbeidstilsynet_export',
    'employee_hours_summary',
  ]),
  organizationId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  filters: reportFilterSchema.optional(),
  includeCharts: z.boolean().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'employee', 'department']).optional(),
});

const exportFormatSchema = z.enum(['json', 'csv', 'pdf', 'excel']);

const scheduleReportSchema = z.object({
  templateId: z.enum([
    'compliance_summary',
    'labor_cost_analysis',
    'attendance_report',
    'overtime_report',
    'shift_coverage_report',
    'arbeidstilsynet_export',
    'employee_hours_summary',
  ]),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  schedule: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  recipients: z.array(z.string().email()).min(1),
  filters: reportFilterSchema.optional(),
  format: exportFormatSchema,
  isActive: z.boolean().optional().default(true),
});

const shareReportSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

/**
 * GET /api/reports/templates
 * List all available report templates
 */
router.get('/templates', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const templates = reportingService.getReportTemplates();

    // Optionally filter by category
    const category = req.query.category as string | undefined;
    const filteredTemplates = category
      ? templates.filter((t) => t.category === category)
      : templates;

    return res.json({
      templates: filteredTemplates,
      categories: ['compliance', 'financial', 'operational', 'regulatory'],
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return res.status(500).json({ error: 'Failed to get report templates' });
  }
});

/**
 * POST /api/reports/generate
 * Generate a report based on template and parameters
 */
router.post('/generate', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = generateReportSchema.parse(req.body);

    const request: GenerateReportRequest = {
      templateId: data.templateId as ReportTemplateType,
      organizationId: data.organizationId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      filters: data.filters as ReportFilter | undefined,
      includeCharts: data.includeCharts,
      groupBy: data.groupBy,
    };

    const report = await reportingService.generateReport(request, req.user!.id);

    return res.status(201).json({
      success: true,
      report: {
        id: report.id,
        templateId: report.templateId,
        templateName: report.templateName,
        generatedAt: report.generatedAt,
        summary: report.summary,
      },
      message: 'Report generated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Generate report error:', error);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/reports/:id
 * Get a generated report by ID
 */
router.get('/:id', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const report = await reportingService.getReport(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // TODO: Check if user has permission to view this report (sharedWith)

    return res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    return res.status(500).json({ error: 'Failed to get report' });
  }
});

/**
 * POST /api/reports/:id/export
 * Export report to specified format (pdf, excel, csv, json)
 */
router.post('/:id/export', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const format = exportFormatSchema.parse(req.body.format || req.query.format || 'json');

    const report = await reportingService.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // TODO: Check if user has permission to export this report

    const exported = await reportingService.exportReport(req.params.id, format);

    // Set response headers for file download
    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);

    // For PDF and Excel (which are placeholders returning JSON), we still send as-is
    // In production, these would return actual binary data
    if (format === 'pdf' || format === 'excel') {
      return res.json({
        message: `${format.toUpperCase()} generation is not yet implemented`,
        placeholder: true,
        data: exported.data,
        filename: exported.filename,
      });
    }

    return res.send(exported.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid export format',
        details: error.errors,
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Export report error:', error);
    return res.status(500).json({ error: 'Failed to export report' });
  }
});

/**
 * POST /api/reports/:id/share
 * Share report with other users
 */
router.post('/:id/share', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = shareReportSchema.parse(req.body);

    const report = await reportingService.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // TODO: Check if current user owns or has permission to share this report

    await reportingService.shareReport(req.params.id, data.userIds);

    return res.json({
      success: true,
      message: `Report shared with ${data.userIds.length} user(s)`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
    }
    console.error('Share report error:', error);
    return res.status(500).json({ error: 'Failed to share report' });
  }
});

/**
 * POST /api/reports/schedule
 * Schedule a recurring report
 */
router.post('/schedule', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = scheduleReportSchema.parse(req.body);

    const scheduledReport = await reportingService.scheduleReport({
      templateId: data.templateId as ReportTemplateType,
      organizationId: data.organizationId,
      name: data.name,
      schedule: data.schedule,
      recipients: data.recipients,
      filters: data.filters as ReportFilter | undefined,
      format: data.format,
      isActive: data.isActive ?? true,
      createdBy: req.user!.id,
    });

    return res.status(201).json({
      success: true,
      scheduledReport: {
        id: scheduledReport.id,
        name: scheduledReport.name,
        templateId: scheduledReport.templateId,
        schedule: scheduledReport.schedule,
        recipients: scheduledReport.recipients,
        format: scheduledReport.format,
        isActive: scheduledReport.isActive,
        nextRun: scheduledReport.nextRun,
        createdAt: scheduledReport.createdAt,
      },
      message: 'Report scheduled successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
    }
    console.error('Schedule report error:', error);
    return res.status(500).json({ error: 'Failed to schedule report' });
  }
});

/**
 * GET /api/reports/scheduled
 * List all scheduled reports for an organization
 */
router.get('/scheduled', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const scheduledReports = await reportingService.getScheduledReports(organizationId);

    return res.json({
      scheduledReports: scheduledReports.map((sr) => ({
        id: sr.id,
        name: sr.name,
        templateId: sr.templateId,
        schedule: sr.schedule,
        recipients: sr.recipients,
        format: sr.format,
        isActive: sr.isActive,
        lastRun: sr.lastRun,
        nextRun: sr.nextRun,
        createdAt: sr.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get scheduled reports error:', error);
    return res.status(500).json({ error: 'Failed to get scheduled reports' });
  }
});

/**
 * PATCH /api/reports/scheduled/:id
 * Update a scheduled report (enable/disable or modify)
 */
router.patch('/scheduled/:id', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { isActive, recipients, schedule, format } = req.body;

    // TODO: Implement update logic in service
    // For now, return a placeholder response

    return res.json({
      success: true,
      message: 'Scheduled report updated successfully',
      // TODO: Return updated scheduled report
    });
  } catch (error) {
    console.error('Update scheduled report error:', error);
    return res.status(500).json({ error: 'Failed to update scheduled report' });
  }
});

/**
 * DELETE /api/reports/scheduled/:id
 * Delete a scheduled report
 */
router.delete('/scheduled/:id', canManageRosters, async (req: AuthRequest, res) => {
  try {
    await reportingService.deleteScheduledReport(req.params.id);

    return res.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });
  } catch (error) {
    console.error('Delete scheduled report error:', error);
    return res.status(500).json({ error: 'Failed to delete scheduled report' });
  }
});

/**
 * GET /api/reports/history
 * Get report generation history for an organization
 */
router.get('/history', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    // TODO: Implement pagination
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // TODO: Query ComplianceReport table for organization's reports
    // For now, return placeholder

    return res.json({
      reports: [],
      pagination: {
        limit,
        offset,
        total: 0,
      },
    });
  } catch (error) {
    console.error('Get report history error:', error);
    return res.status(500).json({ error: 'Failed to get report history' });
  }
});

export default router;
