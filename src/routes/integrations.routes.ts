// Payroll Integration Routes
// Manage connections to Norwegian payroll systems (Tripletex, Fiken, Visma)

import { Router } from 'express';
import { z } from 'zod';
import { PayrollIntegrationService } from '../services/payrollIntegrationService';
import { authenticate, AuthRequest, canManageRosters } from '../middleware/auth';
import { PayrollProvider, IntegrationStatus } from '../types/integrations';

const router = Router();
const integrationService = new PayrollIntegrationService();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const connectProviderSchema = z.object({
  redirectUri: z.string().url(),
});

const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  redirectUri: z.string().url(),
});

const syncSchema = z.object({
  syncType: z.enum(['employees', 'rates', 'all']).optional().default('all'),
});

const exportTimesheetSchema = z.object({
  provider: z.nativeEnum(PayrollProvider),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

/**
 * GET /api/integrations
 * List all available payroll integrations and their capabilities
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const providers = integrationService.getAvailableProviders();

    return res.json({
      providers,
      total: providers.length,
    });
  } catch (error) {
    console.error('Get integrations error:', error);
    return res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

/**
 * POST /api/integrations/:provider/connect
 * Initiate OAuth flow to connect to a payroll provider
 * Returns authorization URL to redirect user to
 */
router.post('/:provider/connect', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const provider = req.params.provider as PayrollProvider;

    // Validate provider
    if (!Object.values(PayrollProvider).includes(provider)) {
      return res.status(400).json({ error: 'Invalid payroll provider' });
    }

    const data = connectProviderSchema.parse(req.body);

    // TODO: Get organizationId from user context
    const organizationId = req.user!.organizationId || '';

    const { authorizationUrl, state } = await integrationService.initiateOAuthFlow(
      organizationId,
      provider,
      data.redirectUri
    );

    return res.json({
      authorizationUrl,
      state,
      provider,
      message: 'Redirect user to authorizationUrl to complete OAuth flow',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Connect provider error:', error);
    return res.status(500).json({ error: 'Failed to initiate connection' });
  }
});

/**
 * POST /api/integrations/:provider/callback
 * Handle OAuth callback after user authorizes the connection
 * Exchange authorization code for access tokens
 */
router.post('/:provider/callback', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const provider = req.params.provider as PayrollProvider;

    // Validate provider
    if (!Object.values(PayrollProvider).includes(provider)) {
      return res.status(400).json({ error: 'Invalid payroll provider' });
    }

    const data = callbackSchema.parse(req.body);

    // TODO: Get organizationId from user context
    const organizationId = req.user!.organizationId || '';

    const integration = await integrationService.handleOAuthCallback(
      organizationId,
      provider,
      data.code,
      data.state,
      data.redirectUri,
      req.user!.id
    );

    return res.json({
      integration: {
        id: integration.id,
        provider: integration.provider,
        status: integration.status,
        autoSync: integration.autoSync,
        syncDirection: integration.syncDirection,
        connectedAt: integration.createdAt,
      },
      message: 'Successfully connected to payroll provider',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('OAuth callback error:', error);
    return res.status(500).json({ error: 'Failed to complete OAuth flow' });
  }
});

/**
 * DELETE /api/integrations/:provider/disconnect
 * Disconnect from a payroll provider
 * Removes stored credentials and stops automatic syncing
 */
router.delete('/:provider/disconnect', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const provider = req.params.provider as PayrollProvider;

    // Validate provider
    if (!Object.values(PayrollProvider).includes(provider)) {
      return res.status(400).json({ error: 'Invalid payroll provider' });
    }

    // TODO: Get organizationId from user context
    const organizationId = req.user!.organizationId || '';

    await integrationService.disconnectIntegration(organizationId, provider);

    return res.json({
      provider,
      status: IntegrationStatus.DISCONNECTED,
      message: 'Successfully disconnected from payroll provider',
    });
  } catch (error) {
    console.error('Disconnect provider error:', error);
    return res.status(500).json({ error: 'Failed to disconnect provider' });
  }
});

/**
 * POST /api/integrations/:provider/sync
 * Manually trigger synchronization with payroll provider
 * Can sync employees, hourly rates, or both
 */
router.post('/:provider/sync', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const provider = req.params.provider as PayrollProvider;

    // Validate provider
    if (!Object.values(PayrollProvider).includes(provider)) {
      return res.status(400).json({ error: 'Invalid payroll provider' });
    }

    const data = syncSchema.parse(req.body);

    // TODO: Get organizationId from user context
    const organizationId = req.user!.organizationId || '';

    const results: any = {
      provider,
      syncedAt: new Date(),
      syncType: data.syncType,
    };

    // Sync employees
    if (data.syncType === 'employees' || data.syncType === 'all') {
      const employeeSync = await integrationService.importEmployees(organizationId, provider);
      results.employees = {
        imported: employeeSync.imported,
        updated: employeeSync.updated,
        skipped: employeeSync.skipped,
        errors: employeeSync.errors,
      };
    }

    // Sync hourly rates
    if (data.syncType === 'rates' || data.syncType === 'all') {
      const rateSync = await integrationService.syncHourlyRates(organizationId, provider);
      results.rates = {
        success: rateSync.success,
        updated: rateSync.ratesUpdated || 0,
        errors: rateSync.errors,
      };
    }

    return res.json({
      success: true,
      results,
      message: 'Synchronization completed',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Failed to sync with provider' });
  }
});

/**
 * GET /api/integrations/:provider/status
 * Check connection status for a payroll provider
 * Validates credentials and API connectivity
 */
router.get('/:provider/status', async (req: AuthRequest, res) => {
  try {
    const provider = req.params.provider as PayrollProvider;

    // Validate provider
    if (!Object.values(PayrollProvider).includes(provider)) {
      return res.status(400).json({ error: 'Invalid payroll provider' });
    }

    // TODO: Get organizationId from user context
    const organizationId = req.user!.organizationId || '';

    const config = await integrationService.getIntegration(organizationId, provider);

    if (!config) {
      return res.json({
        provider,
        status: IntegrationStatus.DISCONNECTED,
        message: 'Not connected to this provider',
      });
    }

    const status = await integrationService.checkConnectionStatus(organizationId, provider);

    return res.json({
      provider,
      status,
      config: {
        autoSync: config.autoSync,
        syncDirection: config.syncDirection,
        lastSyncAt: config.lastSyncAt,
        lastSyncStatus: config.lastSyncStatus,
        syncEmployees: config.syncEmployees,
        syncHourlyRates: config.syncHourlyRates,
        exportTimesheets: config.exportTimesheets,
      },
      message: status === IntegrationStatus.CONNECTED
        ? 'Connection is active'
        : status === IntegrationStatus.ERROR
        ? 'Connection has errors'
        : 'Connection is syncing',
    });
  } catch (error) {
    console.error('Get status error:', error);
    return res.status(500).json({ error: 'Failed to check connection status' });
  }
});

/**
 * POST /api/integrations/export/timesheet
 * Export timesheet data to payroll system for a specific period
 * Used for payroll processing
 */
router.post('/export/timesheet', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = exportTimesheetSchema.parse(req.body);

    // TODO: Get organizationId from user context
    const organizationId = req.user!.organizationId || '';

    const result = await integrationService.exportTimesheet(
      organizationId,
      data.provider,
      new Date(data.periodStart),
      new Date(data.periodEnd),
      req.user!.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        provider: data.provider,
        errors: result.errors,
        warnings: result.warnings,
        message: 'Timesheet export failed',
      });
    }

    return res.json({
      success: true,
      provider: data.provider,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      exportedAt: result.syncedAt,
      timesheetsExported: result.timesheetsExported || 0,
      warnings: result.warnings,
      message: 'Timesheet exported successfully to payroll system',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Export timesheet error:', error);
    return res.status(500).json({ error: 'Failed to export timesheet' });
  }
});

/**
 * GET /api/integrations/:provider/config
 * Get current integration configuration
 */
router.get('/:provider/config', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const provider = req.params.provider as PayrollProvider;

    // Validate provider
    if (!Object.values(PayrollProvider).includes(provider)) {
      return res.status(400).json({ error: 'Invalid payroll provider' });
    }

    // TODO: Get organizationId from user context
    const organizationId = req.user!.organizationId || '';

    const config = await integrationService.getIntegration(organizationId, provider);

    if (!config) {
      return res.status(404).json({
        error: 'Integration not configured',
        provider,
      });
    }

    // Return config without sensitive data
    return res.json({
      provider: config.provider,
      status: config.status,
      autoSync: config.autoSync,
      syncDirection: config.syncDirection,
      lastSyncAt: config.lastSyncAt,
      lastSyncStatus: config.lastSyncStatus,
      syncEmployees: config.syncEmployees,
      syncHourlyRates: config.syncHourlyRates,
      exportTimesheets: config.exportTimesheets,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Get config error:', error);
    return res.status(500).json({ error: 'Failed to fetch integration config' });
  }
});

/**
 * PATCH /api/integrations/:provider/config
 * Update integration configuration (e.g., enable/disable auto-sync)
 */
router.patch('/:provider/config', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const provider = req.params.provider as PayrollProvider;

    // Validate provider
    if (!Object.values(PayrollProvider).includes(provider)) {
      return res.status(400).json({ error: 'Invalid payroll provider' });
    }

    const updateSchema = z.object({
      autoSync: z.boolean().optional(),
      syncEmployees: z.boolean().optional(),
      syncHourlyRates: z.boolean().optional(),
      exportTimesheets: z.boolean().optional(),
    });

    const updates = updateSchema.parse(req.body);

    // TODO: Get organizationId from user context
    const organizationId = req.user!.organizationId || '';

    // TODO: Update integration config in database

    return res.json({
      provider,
      updates,
      message: 'Integration configuration updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update config error:', error);
    return res.status(500).json({ error: 'Failed to update integration config' });
  }
});

export default router;
