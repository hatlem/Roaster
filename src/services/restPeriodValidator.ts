// Rest Period Validation Service
// Implements Norwegian Working Environment Act § 10-8
// Daily rest: 11 hours continuous rest per 24 hours
// Weekly rest: 35 hours continuous rest per 7 days

import { addHours, differenceInHours, isWithinInterval, subDays, addDays } from 'date-fns';
import { ShiftData, RestPeriodViolation, ComplianceConfig } from '../types';

export class RestPeriodValidator {
  constructor(private config: ComplianceConfig) {}

  /**
   * Validates that a new shift doesn't violate daily rest requirements (11 hours)
   * Checks both before and after the shift
   */
  validateDailyRest(
    newShift: ShiftData,
    existingShifts: ShiftData[]
  ): RestPeriodViolation[] {
    const violations: RestPeriodViolation[] = [];

    // Sort shifts by start time
    const allShifts = [...existingShifts, newShift].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    // Find the index of the new shift
    const newShiftIndex = allShifts.findIndex(
      (s) => s.startTime.getTime() === newShift.startTime.getTime() &&
             s.endTime.getTime() === newShift.endTime.getTime()
    );

    // Check rest before new shift
    if (newShiftIndex > 0) {
      const previousShift = allShifts[newShiftIndex - 1];
      const restHours = differenceInHours(
        newShift.startTime,
        previousShift.endTime
      );

      if (restHours < this.config.minDailyRest) {
        violations.push({
          type: 'DAILY',
          violation: `Insufficient daily rest: ${restHours} hours between shifts (minimum ${this.config.minDailyRest} hours required)`,
          requiredRest: this.config.minDailyRest,
          actualRest: restHours,
          affectedShifts: [previousShift.id || '', newShift.id || ''].filter(Boolean),
        });
      }
    }

    // Check rest after new shift
    if (newShiftIndex < allShifts.length - 1) {
      const nextShift = allShifts[newShiftIndex + 1];
      const restHours = differenceInHours(
        nextShift.startTime,
        newShift.endTime
      );

      if (restHours < this.config.minDailyRest) {
        violations.push({
          type: 'DAILY',
          violation: `Insufficient daily rest: ${restHours} hours between shifts (minimum ${this.config.minDailyRest} hours required)`,
          requiredRest: this.config.minDailyRest,
          actualRest: restHours,
          affectedShifts: [newShift.id || '', nextShift.id || ''].filter(Boolean),
        });
      }
    }

    return violations;
  }

  /**
   * Validates weekly rest requirement (35 hours continuous)
   * Must have 35 continuous hours of rest within each 7-day period
   */
  validateWeeklyRest(
    userId: string,
    shifts: ShiftData[],
    periodStart: Date,
    periodEnd: Date
  ): RestPeriodViolation[] {
    const violations: RestPeriodViolation[] = [];

    // Get all shifts for this user, sorted by start time
    const userShifts = shifts
      .filter((s) => s.userId === userId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    if (userShifts.length === 0) {
      return violations;
    }

    // Check each 7-day rolling window
    let currentDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    while (currentDate <= endDate) {
      const windowStart = currentDate;
      const windowEnd = addDays(currentDate, 7);

      // Get shifts in this 7-day window
      const windowShifts = userShifts.filter((shift) =>
        isWithinInterval(shift.startTime, { start: windowStart, end: windowEnd }) ||
        isWithinInterval(shift.endTime, { start: windowStart, end: windowEnd })
      );

      if (windowShifts.length > 0) {
        // Find the longest continuous rest period in this window
        const longestRest = this.findLongestRestPeriod(windowShifts, windowStart, windowEnd);

        if (longestRest < this.config.minWeeklyRest) {
          violations.push({
            type: 'WEEKLY',
            violation: `Insufficient weekly rest: ${longestRest} hours of continuous rest in 7-day period (minimum ${this.config.minWeeklyRest} hours required)`,
            requiredRest: this.config.minWeeklyRest,
            actualRest: longestRest,
            affectedShifts: windowShifts.map((s) => s.id || '').filter(Boolean),
          });
        }
      }

      // Move to next day
      currentDate = addDays(currentDate, 1);
    }

    return violations;
  }

  /**
   * Finds the longest continuous rest period between shifts
   */
  private findLongestRestPeriod(
    shifts: ShiftData[],
    periodStart: Date,
    periodEnd: Date
  ): number {
    if (shifts.length === 0) {
      return differenceInHours(periodEnd, periodStart);
    }

    let longestRest = 0;

    // Sort shifts by start time
    const sortedShifts = [...shifts].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    // Check rest from period start to first shift
    const restBeforeFirst = differenceInHours(
      sortedShifts[0].startTime,
      periodStart
    );
    longestRest = Math.max(longestRest, restBeforeFirst);

    // Check rest between consecutive shifts
    for (let i = 0; i < sortedShifts.length - 1; i++) {
      const restBetween = differenceInHours(
        sortedShifts[i + 1].startTime,
        sortedShifts[i].endTime
      );
      longestRest = Math.max(longestRest, restBetween);
    }

    // Check rest from last shift to period end
    const restAfterLast = differenceInHours(
      periodEnd,
      sortedShifts[sortedShifts.length - 1].endTime
    );
    longestRest = Math.max(longestRest, restAfterLast);

    return longestRest;
  }

  /**
   * Comprehensive validation of all rest period requirements
   */
  validateAllRestPeriods(
    newShift: ShiftData,
    existingShifts: ShiftData[],
    periodStart: Date,
    periodEnd: Date
  ): RestPeriodViolation[] {
    const violations: RestPeriodViolation[] = [];

    // Validate daily rest
    const dailyViolations = this.validateDailyRest(newShift, existingShifts);
    violations.push(...dailyViolations);

    // Validate weekly rest
    const weeklyViolations = this.validateWeeklyRest(
      newShift.userId,
      [...existingShifts, newShift],
      periodStart,
      periodEnd
    );
    violations.push(...weeklyViolations);

    return violations;
  }
}
