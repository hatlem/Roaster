// Type definitions for Norwegian Labor Law Compliance

export interface ComplianceConfig {
  maxDailyHours: number;           // Default: 9
  maxWeeklyHours: number;          // Default: 40
  minDailyRest: number;            // Default: 11 hours
  minWeeklyRest: number;           // Default: 35 hours
  publishDeadlineDays: number;     // Default: 14 days
  maxOvertimePerWeek: number;      // Default: 10 hours
  maxOvertimePer4Weeks: number;    // Default: 25 hours
  maxOvertimePerYear: number;      // Default: 200 hours
}

export interface ShiftData {
  id?: string;
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
  userId: string;
}

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  warnings: string[];
}

export interface RestPeriodViolation {
  type: 'DAILY' | 'WEEKLY';
  violation: string;
  requiredRest: number;
  actualRest: number;
  affectedShifts: string[];
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
}

export interface PublishValidation {
  canPublish: boolean;
  daysUntilStart: number;
  isLate: boolean;
  publishDeadline: Date;
  warnings: string[];
}
