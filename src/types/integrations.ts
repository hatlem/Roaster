// Payroll Integration Type Definitions
// Support for Norwegian payroll systems (Tripletex, Fiken, Visma)

export enum PayrollProvider {
  TRIPLETEX = 'tripletex',
  FIKEN = 'fiken',
  VISMA = 'visma',
}

export enum IntegrationStatus {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected',
  ERROR = 'error',
  SYNCING = 'syncing',
}

export enum SyncDirection {
  IMPORT = 'import',      // Import from payroll to Roaster
  EXPORT = 'export',      // Export from Roaster to payroll
  BIDIRECTIONAL = 'bidirectional',
}

// Integration configuration stored in database
export interface IntegrationConfig {
  id: string;
  organizationId: string;
  provider: PayrollProvider;
  status: IntegrationStatus;

  // OAuth credentials (encrypted)
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;

  // Provider-specific configuration
  companyId?: string;        // Tripletex/Fiken company identifier
  apiKey?: string;           // Alternative to OAuth for some providers

  // Sync settings
  autoSync: boolean;
  syncDirection: SyncDirection;
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'failed' | 'partial';
  lastSyncError?: string;

  // Feature flags
  syncEmployees: boolean;
  syncHourlyRates: boolean;
  exportTimesheets: boolean;

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

// Timesheet export format for payroll systems
export interface TimesheetExport {
  organizationId: string;
  provider: PayrollProvider;
  periodStart: Date;
  periodEnd: Date;

  // Timesheet entries
  entries: TimesheetEntry[];

  // Summary
  summary: {
    totalEmployees: number;
    totalHours: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalNightHours: number;
    totalWeekendHours: number;
  };

  // Metadata
  exportedAt: Date;
  exportedBy: string;
  format: 'tripletex' | 'fiken' | 'visma' | 'generic';
}

export interface TimesheetEntry {
  employeeId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department?: string;

  // Time entries per shift
  shifts: ShiftEntry[];

  // Employee summary
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;      // 21:00-06:00
  weekendHours: number;    // Saturday/Sunday

  // Rates and costs
  hourlyRate: number;
  totalCost: number;
}

export interface ShiftEntry {
  shiftId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
  totalHours: number;

  // Shift classification
  isOvertime: boolean;
  isNightShift: boolean;   // Any hours between 21:00-06:00
  isWeekendShift: boolean; // Saturday/Sunday

  // Location/cost center
  department?: string;
  location?: string;
  costCenter?: string;

  // Compliance flags
  violatesRestPeriod: boolean;
  violatesDailyLimit: boolean;
  violatesWeeklyLimit: boolean;
}

// Employee data sync from payroll
export interface EmployeeSync {
  provider: PayrollProvider;
  syncedAt: Date;
  employees: PayrollEmployee[];

  // Sync statistics
  imported: number;
  updated: number;
  skipped: number;
  errors: EmployeeSyncError[];
}

export interface PayrollEmployee {
  // Payroll system identifiers
  externalId: string;        // ID in payroll system
  employeeNumber: string;

  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;

  // Employment details
  department?: string;
  position?: string;
  employmentType?: 'full_time' | 'part_time' | 'temporary';
  startDate?: Date;
  endDate?: Date;

  // Compensation
  hourlyRate: number;
  currency: string;          // NOK, SEK, etc.

  // Metadata
  isActive: boolean;
  lastUpdated?: Date;
}

export interface EmployeeSyncError {
  externalId: string;
  employeeNumber?: string;
  name?: string;
  error: string;
  details?: any;
}

// OAuth flow data
export interface OAuthFlowData {
  provider: PayrollProvider;
  state: string;              // CSRF protection
  authorizationUrl: string;
  codeVerifier?: string;      // For PKCE flow
  redirectUri: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface OAuthCallbackData {
  provider: PayrollProvider;
  code: string;
  state: string;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;          // Seconds
  tokenType: string;
  scope?: string;
}

// Sync result
export interface SyncResult {
  success: boolean;
  provider: PayrollProvider;
  syncedAt: Date;

  // What was synced
  employeesImported?: number;
  ratesUpdated?: number;
  timesheetsExported?: number;

  // Errors
  errors: string[];
  warnings: string[];

  // Details
  details?: any;
}

// Provider capabilities
export interface ProviderCapabilities {
  provider: PayrollProvider;
  name: string;
  description: string;
  website: string;

  // Supported features
  supportsOAuth: boolean;
  supportsApiKey: boolean;
  supportsEmployeeImport: boolean;
  supportsTimesheetExport: boolean;
  supportsRateSync: boolean;

  // Required scopes for OAuth
  requiredScopes?: string[];

  // Documentation
  setupGuide?: string;
  apiDocumentation?: string;
}
