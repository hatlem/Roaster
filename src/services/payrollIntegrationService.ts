// Payroll Integration Service
// Implements adapter pattern for Norwegian payroll systems

import { PrismaClient } from '@prisma/client';
import {
  PayrollProvider,
  IntegrationConfig,
  IntegrationStatus,
  TimesheetExport,
  TimesheetEntry,
  ShiftEntry,
  EmployeeSync,
  PayrollEmployee,
  OAuthTokenResponse,
  SyncResult,
  ProviderCapabilities,
} from '../types/integrations';

const prisma = new PrismaClient();

// ============================================================================
// Abstract PayrollAdapter Interface
// ============================================================================

export abstract class PayrollAdapter {
  protected config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  // OAuth flow methods
  abstract getAuthorizationUrl(redirectUri: string, state: string): string;
  abstract exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse>;
  abstract refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse>;

  // Employee sync
  abstract importEmployees(): Promise<EmployeeSync>;
  abstract getEmployee(externalId: string): Promise<PayrollEmployee | null>;

  // Timesheet export
  abstract exportTimesheet(timesheet: TimesheetExport): Promise<SyncResult>;

  // Rate synchronization
  abstract syncHourlyRates(): Promise<SyncResult>;

  // Connection validation
  abstract validateConnection(): Promise<boolean>;

  // Provider capabilities
  abstract getCapabilities(): ProviderCapabilities;
}

// ============================================================================
// Tripletex Adapter (Norwegian accounting/payroll system)
// ============================================================================

export class TripletexAdapter extends PayrollAdapter {
  private readonly baseUrl = 'https://tripletex.no/v2';

  getAuthorizationUrl(redirectUri: string, state: string): string {
    // TODO: Implement Tripletex OAuth flow
    // Tripletex uses consumer token authentication
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.TRIPLETEX_CLIENT_ID || '',
      redirect_uri: redirectUri,
      state,
      scope: 'employee:read timesheet:write',
    });

    return `${this.baseUrl}/token/consumer?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    // TODO: Implement token exchange
    // POST to /token/consumer with consumer token
    throw new Error('Tripletex OAuth not yet implemented');
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    // TODO: Implement token refresh
    throw new Error('Tripletex token refresh not yet implemented');
  }

  async importEmployees(): Promise<EmployeeSync> {
    // TODO: Implement employee import from Tripletex
    // GET /employee endpoint
    // Map Tripletex employee structure to PayrollEmployee

    console.log('Importing employees from Tripletex...');

    // Stub implementation
    return {
      provider: PayrollProvider.TRIPLETEX,
      syncedAt: new Date(),
      employees: [],
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };
  }

  async getEmployee(externalId: string): Promise<PayrollEmployee | null> {
    // TODO: Implement single employee fetch
    // GET /employee/{id}
    throw new Error('Tripletex getEmployee not yet implemented');
  }

  async exportTimesheet(timesheet: TimesheetExport): Promise<SyncResult> {
    // TODO: Implement timesheet export to Tripletex
    // POST /timesheet entries
    // Format: Convert our shift data to Tripletex timesheet format
    // Required fields: employeeId, date, hours, activity, project

    console.log('Exporting timesheet to Tripletex...');

    return {
      success: false,
      provider: PayrollProvider.TRIPLETEX,
      syncedAt: new Date(),
      errors: ['Tripletex timesheet export not yet implemented'],
      warnings: [],
    };
  }

  async syncHourlyRates(): Promise<SyncResult> {
    // TODO: Implement hourly rate sync
    // GET /employee/{id}/employment/details
    // Extract hourly rate from salary information

    return {
      success: false,
      provider: PayrollProvider.TRIPLETEX,
      syncedAt: new Date(),
      errors: ['Tripletex rate sync not yet implemented'],
      warnings: [],
    };
  }

  async validateConnection(): Promise<boolean> {
    // TODO: Validate API connection
    // Try a simple API call like GET /company
    try {
      // Stub - should make actual API call
      return false;
    } catch (error) {
      return false;
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      provider: PayrollProvider.TRIPLETEX,
      name: 'Tripletex',
      description: 'Norwegian cloud-based accounting and payroll system',
      website: 'https://www.tripletex.no',
      supportsOAuth: true,
      supportsApiKey: true,
      supportsEmployeeImport: true,
      supportsTimesheetExport: true,
      supportsRateSync: true,
      requiredScopes: ['employee:read', 'timesheet:write', 'salary:read'],
      apiDocumentation: 'https://tripletex.no/execute/docViewer?articleId=853',
    };
  }
}

// ============================================================================
// Fiken Adapter (Norwegian accounting system with payroll)
// ============================================================================

export class FikenAdapter extends PayrollAdapter {
  private readonly baseUrl = 'https://api.fiken.no/api/v2';

  getAuthorizationUrl(redirectUri: string, state: string): string {
    // TODO: Implement Fiken OAuth flow
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.FIKEN_CLIENT_ID || '',
      redirect_uri: redirectUri,
      state,
      scope: 'read:company write:timesheet',
    });

    return `https://fiken.no/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    // TODO: Implement Fiken token exchange
    // POST to /oauth/token
    throw new Error('Fiken OAuth not yet implemented');
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    // TODO: Implement token refresh
    throw new Error('Fiken token refresh not yet implemented');
  }

  async importEmployees(): Promise<EmployeeSync> {
    // TODO: Implement employee import from Fiken
    // Fiken may not have direct employee endpoint - might need to use contacts

    console.log('Importing employees from Fiken...');

    return {
      provider: PayrollProvider.FIKEN,
      syncedAt: new Date(),
      employees: [],
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };
  }

  async getEmployee(externalId: string): Promise<PayrollEmployee | null> {
    // TODO: Implement single employee fetch
    throw new Error('Fiken getEmployee not yet implemented');
  }

  async exportTimesheet(timesheet: TimesheetExport): Promise<SyncResult> {
    // TODO: Implement timesheet export to Fiken
    // Fiken uses salary/wage journal entries

    console.log('Exporting timesheet to Fiken...');

    return {
      success: false,
      provider: PayrollProvider.FIKEN,
      syncedAt: new Date(),
      errors: ['Fiken timesheet export not yet implemented'],
      warnings: [],
    };
  }

  async syncHourlyRates(): Promise<SyncResult> {
    // TODO: Implement hourly rate sync

    return {
      success: false,
      provider: PayrollProvider.FIKEN,
      syncedAt: new Date(),
      errors: ['Fiken rate sync not yet implemented'],
      warnings: [],
    };
  }

  async validateConnection(): Promise<boolean> {
    // TODO: Validate API connection
    try {
      // Stub - should make actual API call to /companies
      return false;
    } catch (error) {
      return false;
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      provider: PayrollProvider.FIKEN,
      name: 'Fiken',
      description: 'Norwegian cloud accounting with payroll capabilities',
      website: 'https://www.fiken.no',
      supportsOAuth: true,
      supportsApiKey: false,
      supportsEmployeeImport: true,
      supportsTimesheetExport: true,
      supportsRateSync: false,
      requiredScopes: ['read:company', 'write:timesheet'],
      apiDocumentation: 'https://api.fiken.no/api/v2/docs/',
    };
  }
}

// ============================================================================
// Visma Adapter (Large Norwegian ERP/Payroll provider)
// ============================================================================

export class VismaAdapter extends PayrollAdapter {
  private readonly baseUrl = 'https://api.visma.com';

  getAuthorizationUrl(redirectUri: string, state: string): string {
    // TODO: Implement Visma OAuth flow
    // Visma has multiple products - this targets Visma.net
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.VISMA_CLIENT_ID || '',
      redirect_uri: redirectUri,
      state,
      scope: 'employee:read timeentry:write',
    });

    return `https://connect.visma.com/connect/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    // TODO: Implement Visma token exchange
    // POST to /connect/token
    throw new Error('Visma OAuth not yet implemented');
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    // TODO: Implement token refresh
    throw new Error('Visma token refresh not yet implemented');
  }

  async importEmployees(): Promise<EmployeeSync> {
    // TODO: Implement employee import from Visma
    // Endpoint depends on Visma product (Visma.net, Visma HRM, etc.)

    console.log('Importing employees from Visma...');

    return {
      provider: PayrollProvider.VISMA,
      syncedAt: new Date(),
      employees: [],
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };
  }

  async getEmployee(externalId: string): Promise<PayrollEmployee | null> {
    // TODO: Implement single employee fetch
    throw new Error('Visma getEmployee not yet implemented');
  }

  async exportTimesheet(timesheet: TimesheetExport): Promise<SyncResult> {
    // TODO: Implement timesheet export to Visma
    // Format depends on Visma product

    console.log('Exporting timesheet to Visma...');

    return {
      success: false,
      provider: PayrollProvider.VISMA,
      syncedAt: new Date(),
      errors: ['Visma timesheet export not yet implemented'],
      warnings: [],
    };
  }

  async syncHourlyRates(): Promise<SyncResult> {
    // TODO: Implement hourly rate sync

    return {
      success: false,
      provider: PayrollProvider.VISMA,
      syncedAt: new Date(),
      errors: ['Visma rate sync not yet implemented'],
      warnings: [],
    };
  }

  async validateConnection(): Promise<boolean> {
    // TODO: Validate API connection
    try {
      // Stub - should make actual API call
      return false;
    } catch (error) {
      return false;
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      provider: PayrollProvider.VISMA,
      name: 'Visma',
      description: 'Enterprise ERP and payroll system',
      website: 'https://www.visma.no',
      supportsOAuth: true,
      supportsApiKey: true,
      supportsEmployeeImport: true,
      supportsTimesheetExport: true,
      supportsRateSync: true,
      requiredScopes: ['employee:read', 'timeentry:write', 'salary:read'],
      apiDocumentation: 'https://developer.visma.com/',
    };
  }
}

// ============================================================================
// PayrollIntegrationService - Main orchestration service
// ============================================================================

export class PayrollIntegrationService {
  /**
   * Get adapter instance for a provider
   */
  private getAdapter(config: IntegrationConfig): PayrollAdapter {
    switch (config.provider) {
      case PayrollProvider.TRIPLETEX:
        return new TripletexAdapter(config);
      case PayrollProvider.FIKEN:
        return new FikenAdapter(config);
      case PayrollProvider.VISMA:
        return new VismaAdapter(config);
      default:
        throw new Error(`Unsupported payroll provider: ${config.provider}`);
    }
  }

  /**
   * Get all available payroll providers and their capabilities
   */
  getAvailableProviders(): ProviderCapabilities[] {
    return [
      new TripletexAdapter({} as IntegrationConfig).getCapabilities(),
      new FikenAdapter({} as IntegrationConfig).getCapabilities(),
      new VismaAdapter({} as IntegrationConfig).getCapabilities(),
    ];
  }

  /**
   * Get integration configuration for an organization
   */
  async getIntegration(organizationId: string, provider: PayrollProvider): Promise<IntegrationConfig | null> {
    // TODO: Fetch from database (Prisma model needed)
    // For now, return null as this is a stub
    return null;
  }

  /**
   * Create or update integration configuration
   */
  async saveIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    // TODO: Save to database with encrypted tokens
    // Use crypto to encrypt accessToken and refreshToken before saving

    const integration: IntegrationConfig = {
      ...config,
      id: `int_${Date.now()}`, // Generate proper ID
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return integration;
  }

  /**
   * Start OAuth flow for a provider
   */
  async initiateOAuthFlow(
    organizationId: string,
    provider: PayrollProvider,
    redirectUri: string
  ): Promise<{ authorizationUrl: string; state: string }> {
    // Generate CSRF state token
    const state = this.generateState(organizationId, provider);

    // Get provider config (or create minimal one for OAuth)
    const config: IntegrationConfig = {
      id: '',
      organizationId,
      provider,
      status: IntegrationStatus.DISCONNECTED,
      autoSync: false,
      syncDirection: 'import' as any,
      syncEmployees: true,
      syncHourlyRates: true,
      exportTimesheets: true,
      createdAt: new Date(),
      createdBy: '',
      updatedAt: new Date(),
    };

    const adapter = this.getAdapter(config);
    const authorizationUrl = adapter.getAuthorizationUrl(redirectUri, state);

    // TODO: Store OAuth flow state in Redis/database for validation in callback

    return { authorizationUrl, state };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleOAuthCallback(
    organizationId: string,
    provider: PayrollProvider,
    code: string,
    state: string,
    redirectUri: string,
    userId: string
  ): Promise<IntegrationConfig> {
    // TODO: Validate state token from Redis/database

    const config: IntegrationConfig = {
      id: '',
      organizationId,
      provider,
      status: IntegrationStatus.DISCONNECTED,
      autoSync: false,
      syncDirection: 'import' as any,
      syncEmployees: true,
      syncHourlyRates: true,
      exportTimesheets: true,
      createdAt: new Date(),
      createdBy: userId,
      updatedAt: new Date(),
    };

    const adapter = this.getAdapter(config);

    // Exchange code for tokens
    const tokenResponse = await adapter.exchangeCodeForToken(code, redirectUri);

    // Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokenResponse.expiresIn);

    // Save integration with tokens
    const integration = await this.saveIntegration({
      organizationId,
      provider,
      status: IntegrationStatus.CONNECTED,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      tokenExpiry,
      autoSync: false,
      syncDirection: 'import' as any,
      syncEmployees: true,
      syncHourlyRates: true,
      exportTimesheets: true,
      createdBy: userId,
    });

    return integration;
  }

  /**
   * Disconnect integration
   */
  async disconnectIntegration(organizationId: string, provider: PayrollProvider): Promise<void> {
    // TODO: Remove from database or mark as disconnected
    // Clear all tokens
  }

  /**
   * Import employees from payroll system
   */
  async importEmployees(organizationId: string, provider: PayrollProvider): Promise<EmployeeSync> {
    const config = await this.getIntegration(organizationId, provider);
    if (!config) {
      throw new Error('Integration not configured');
    }

    const adapter = this.getAdapter(config);
    const result = await adapter.importEmployees();

    // TODO: Update lastSyncAt in database

    return result;
  }

  /**
   * Export timesheet to payroll system
   */
  async exportTimesheet(
    organizationId: string,
    provider: PayrollProvider,
    periodStart: Date,
    periodEnd: Date,
    exportedBy: string
  ): Promise<SyncResult> {
    const config = await this.getIntegration(organizationId, provider);
    if (!config) {
      throw new Error('Integration not configured');
    }

    // Build timesheet from shifts in the period
    const timesheet = await this.buildTimesheetExport(
      organizationId,
      provider,
      periodStart,
      periodEnd,
      exportedBy
    );

    const adapter = this.getAdapter(config);
    const result = await adapter.exportTimesheet(timesheet);

    // TODO: Update lastSyncAt in database

    return result;
  }

  /**
   * Sync hourly rates from payroll system
   */
  async syncHourlyRates(organizationId: string, provider: PayrollProvider): Promise<SyncResult> {
    const config = await this.getIntegration(organizationId, provider);
    if (!config) {
      throw new Error('Integration not configured');
    }

    const adapter = this.getAdapter(config);
    const result = await adapter.syncHourlyRates();

    // TODO: Update user hourly rates in database

    return result;
  }

  /**
   * Check integration connection status
   */
  async checkConnectionStatus(organizationId: string, provider: PayrollProvider): Promise<IntegrationStatus> {
    const config = await this.getIntegration(organizationId, provider);
    if (!config) {
      return IntegrationStatus.DISCONNECTED;
    }

    const adapter = this.getAdapter(config);
    const isValid = await adapter.validateConnection();

    return isValid ? IntegrationStatus.CONNECTED : IntegrationStatus.ERROR;
  }

  /**
   * Build timesheet export from database shifts
   */
  private async buildTimesheetExport(
    organizationId: string,
    provider: PayrollProvider,
    periodStart: Date,
    periodEnd: Date,
    exportedBy: string
  ): Promise<TimesheetExport> {
    // TODO: Query shifts from database for the period
    // Group by employee
    // Calculate totals
    // Classify shifts (overtime, night, weekend)

    const entries: TimesheetEntry[] = [];

    // Stub implementation
    const shifts = await prisma.shift.findMany({
      where: {
        roster: { organizationId },
        startTime: { gte: periodStart },
        endTime: { lte: periodEnd },
      },
      include: {
        user: true,
        roster: true,
      },
    });

    // Group shifts by employee
    const employeeMap = new Map<string, typeof shifts>();
    for (const shift of shifts) {
      const userId = shift.userId;
      if (!employeeMap.has(userId)) {
        employeeMap.set(userId, []);
      }
      employeeMap.get(userId)!.push(shift);
    }

    // Build entries
    for (const [userId, userShifts] of employeeMap) {
      const user = userShifts[0].user;

      const shiftEntries: ShiftEntry[] = userShifts.map((shift) => {
        const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
        const netHours = hours - shift.breakMinutes / 60;

        return {
          shiftId: shift.id,
          date: shift.startTime,
          startTime: shift.startTime,
          endTime: shift.endTime,
          breakMinutes: shift.breakMinutes,
          totalHours: netHours,
          isOvertime: shift.isOvertime || false,
          isNightShift: this.isNightShift(shift.startTime, shift.endTime),
          isWeekendShift: this.isWeekendShift(shift.startTime),
          department: shift.department || undefined,
          location: shift.location || undefined,
          violatesRestPeriod: shift.violatesRestPeriod || false,
          violatesDailyLimit: shift.violatesDailyLimit || false,
          violatesWeeklyLimit: shift.violatesWeeklyLimit || false,
        };
      });

      const totalHours = shiftEntries.reduce((sum, s) => sum + s.totalHours, 0);
      const overtimeHours = shiftEntries.filter(s => s.isOvertime).reduce((sum, s) => sum + s.totalHours, 0);
      const nightHours = shiftEntries.filter(s => s.isNightShift).reduce((sum, s) => sum + s.totalHours, 0);
      const weekendHours = shiftEntries.filter(s => s.isWeekendShift).reduce((sum, s) => sum + s.totalHours, 0);
      const regularHours = totalHours - overtimeHours;

      entries.push({
        employeeId: user.id,
        employeeNumber: user.employeeNumber || '',
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department || undefined,
        shifts: shiftEntries,
        totalHours,
        regularHours,
        overtimeHours,
        nightHours,
        weekendHours,
        hourlyRate: 0, // TODO: Get from user profile
        totalCost: 0,  // TODO: Calculate based on rate
      });
    }

    const summary = {
      totalEmployees: entries.length,
      totalHours: entries.reduce((sum, e) => sum + e.totalHours, 0),
      totalRegularHours: entries.reduce((sum, e) => sum + e.regularHours, 0),
      totalOvertimeHours: entries.reduce((sum, e) => sum + e.overtimeHours, 0),
      totalNightHours: entries.reduce((sum, e) => sum + e.nightHours, 0),
      totalWeekendHours: entries.reduce((sum, e) => sum + e.weekendHours, 0),
    };

    return {
      organizationId,
      provider,
      periodStart,
      periodEnd,
      entries,
      summary,
      exportedAt: new Date(),
      exportedBy,
      format: provider === PayrollProvider.TRIPLETEX ? 'tripletex' :
              provider === PayrollProvider.FIKEN ? 'fiken' :
              provider === PayrollProvider.VISMA ? 'visma' : 'generic',
    };
  }

  /**
   * Check if shift includes night hours (21:00-06:00)
   */
  private isNightShift(startTime: Date, endTime: Date): boolean {
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();

    // Simplified check - any shift starting or ending in night hours
    return (startHour >= 21 || startHour < 6) || (endHour >= 21 || endHour <= 6);
  }

  /**
   * Check if shift is on weekend
   */
  private isWeekendShift(startTime: Date): boolean {
    const day = startTime.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Generate secure state token for OAuth
   */
  private generateState(organizationId: string, provider: PayrollProvider): string {
    // TODO: Use crypto to generate secure random state
    // Store in Redis with expiry
    return Buffer.from(`${organizationId}:${provider}:${Date.now()}`).toString('base64');
  }
}
