// Norwegian Labor Law Compliance Configuration
// Based on Arbeidsmiljøloven (Working Environment Act)

import { ComplianceConfig } from '../types';

export const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
  // Normal working hours limits (§ 10-4)
  maxDailyHours: 9,        // Max 9 hours per 24-hour period
  maxWeeklyHours: 40,      // Max 40 hours per 7-day period (can be 38 or 36 for shift work)

  // Rest period requirements (§ 10-8)
  minDailyRest: 11,        // Min 11 hours continuous rest per 24 hours
  minWeeklyRest: 35,       // Min 35 hours continuous rest per 7 days

  // Roster publication (§ 10-2, §10-6)
  publishDeadlineDays: 14, // Roster must be published 14 days before it starts

  // Overtime limits (§ 10-6)
  maxOvertimePerWeek: 10,      // Max 10 hours overtime per week
  maxOvertimePer4Weeks: 25,    // Max 25 hours overtime per 4 weeks
  maxOvertimePerYear: 200,     // Max 200 hours overtime per year
};

// Get compliance config from environment or use defaults
export function getComplianceConfig(): ComplianceConfig {
  return {
    maxDailyHours: parseInt(process.env.MAX_DAILY_WORK_HOURS || '9'),
    maxWeeklyHours: parseInt(process.env.MAX_WEEKLY_WORK_HOURS || '40'),
    minDailyRest: parseInt(process.env.MIN_DAILY_REST_HOURS || '11'),
    minWeeklyRest: parseInt(process.env.MIN_WEEKLY_REST_HOURS || '35'),
    publishDeadlineDays: parseInt(process.env.ROSTER_PUBLISH_DEADLINE_DAYS || '14'),
    maxOvertimePerWeek: 10,
    maxOvertimePer4Weeks: 25,
    maxOvertimePerYear: 200,
  };
}
