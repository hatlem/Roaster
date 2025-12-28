// Enhanced Types with Visual Compliance Indicators and Labor Costs

export interface ComplianceConfig {
  maxDailyHours: number;
  maxWeeklyHours: number;
  minDailyRest: number;
  minWeeklyRest: number;
  publishDeadlineDays: number;
  maxOvertimePerWeek: number;
  maxOvertimePer4Weeks: number;
  maxOvertimePerYear: number;
}

export interface ShiftData {
  id?: string;
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
  userId: string;
  hourlyRate?: number; // NEW: For labor cost calculation
}

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  warnings: string[];
  visualIndicator?: VisualComplianceIndicator; // NEW
}

// NEW: Visual compliance indicator for UI
export interface VisualComplianceIndicator {
  status: 'compliant' | 'warning' | 'violation';
  color: 'green' | 'yellow' | 'red';
  icon: 'check' | 'alert' | 'error';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  quickFixes?: QuickFix[];
}

// NEW: Quick fix suggestions
export interface QuickFix {
  action: string;
  description: string;
  impact: string;
  autoApplicable: boolean;
}

export interface RestPeriodViolation {
  type: 'DAILY' | 'WEEKLY';
  violation: string;
  requiredRest: number;
  actualRest: number;
  affectedShifts: string[];
  visualIndicator?: VisualComplianceIndicator; // NEW
}

export interface WorkingHoursViolation {
  type: 'DAILY' | 'WEEKLY' | 'OVERTIME_WEEKLY' | 'OVERTIME_4WEEKS' | 'OVERTIME_YEARLY';
  violation: string;
  limit: number;
  actual: number;
  affectedPeriod: {
    start: Date;
    end: Date;
  };
  visualIndicator?: VisualComplianceIndicator; // NEW
}

export interface PublishValidation {
  canPublish: boolean;
  daysUntilStart: number;
  isLate: boolean;
  publishDeadline: Date;
  warnings: string[];
  visualIndicator?: VisualComplianceIndicator; // NEW
}

// NEW: Labor cost tracking
export interface LaborCost {
  hourlyRate: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalCost: number;
  regularCost: number;
  overtimeCost: number;
  overtimeMultiplier: number; // Norwegian law: 40% minimum
}

// NEW: Shift marketplace
export interface ShiftMarketplace {
  shiftId: string;
  availableFrom: Date;
  availableUntil: Date;
  postedBy: string;
  reason?: string;
  eligibleEmployees: string[]; // Users who can claim
  claimedBy?: string;
  claimedAt?: Date;
  status: 'available' | 'claimed' | 'approved' | 'rejected' | 'expired';
}

// NEW: Shift swap request
export interface ShiftSwapRequest {
  id: string;
  requestedBy: string;
  requestedShiftId: string;
  offeredShiftId?: string;
  targetEmployee?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
}

// NEW: Time off request
export interface TimeOffRequest {
  id: string;
  userId: string;
  type: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

// NEW: Accrual balances
export interface AccrualBalance {
  userId: string;
  type: 'vacation' | 'sick' | 'comp_time';
  earnedDays: number;
  usedDays: number;
  remainingDays: number;
  expirationDate?: Date;
  carryOverDays?: number;
}

// NEW: Dashboard metrics
export interface DashboardMetrics {
  period: {
    start: Date;
    end: Date;
  };
  labor: {
    budgetedHours: number;
    scheduledHours: number;
    actualHours: number;
    budgetedCost: number;
    scheduledCost: number;
    actualCost: number;
    variance: number;
    variancePercentage: number;
  };
  compliance: {
    totalShifts: number;
    compliantShifts: number;
    shiftsWithWarnings: number;
    shiftsWithViolations: number;
    complianceRate: number;
    latePublications: number;
  };
  attendance: {
    totalShifts: number;
    completedShifts: number;
    missedShifts: number;
    lateShifts: number;
    attendanceRate: number;
  };
  overtime: {
    totalOvertimeHours: number;
    overtimeCost: number;
    employeesWithOvertime: number;
    averageOvertimePerEmployee: number;
  };
}

// NEW: Report parameters
export interface ReportParams {
  organizationId: string;
  startDate: Date;
  endDate: Date;
  reportType: 'compliance' | 'labor_cost' | 'attendance' | 'overtime' | 'custom';
  format: 'json' | 'csv' | 'pdf' | 'excel';
  filters?: {
    departmentIds?: string[];
    userIds?: string[];
    includeArchived?: boolean;
  };
  groupBy?: 'day' | 'week' | 'month' | 'employee' | 'department';
}
