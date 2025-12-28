// Working Hours Validation Service
// Implements Norwegian Working Environment Act § 10-4, § 10-6
// Daily limit: 9 hours per 24-hour period
// Weekly limit: 40 hours per 7-day period
// Overtime limits: 10h/week, 25h/4weeks, 200h/year

import { differenceInHours, differenceInMinutes, addDays, addWeeks, subYears, isWithinInterval } from 'date-fns';
import { ShiftData, WorkingHoursViolation, ComplianceConfig } from '../types';

export class WorkingHoursValidator {
  constructor(private config: ComplianceConfig) {}

  /**
   * Calculate actual working hours for a shift (excluding breaks)
   */
  private calculateShiftHours(shift: ShiftData): number {
    const totalMinutes = differenceInMinutes(shift.endTime, shift.startTime);
    const workingMinutes = totalMinutes - shift.breakMinutes;
    return workingMinutes / 60;
  }

  /**
   * Validates daily working hours limit (9 hours per 24-hour period)
   */
  validateDailyHours(
    newShift: ShiftData,
    existingShifts: ShiftData[]
  ): WorkingHoursViolation[] {
    const violations: WorkingHoursViolation[] = [];

    // Calculate new shift hours
    const newShiftHours = this.calculateShiftHours(newShift);

    // Check if the shift itself exceeds daily limit
    if (newShiftHours > this.config.maxDailyHours) {
      violations.push({
        type: 'DAILY',
        violation: `Single shift exceeds daily limit: ${newShiftHours.toFixed(1)} hours (maximum ${this.config.maxDailyHours} hours)`,
        limit: this.config.maxDailyHours,
        actual: newShiftHours,
        affectedPeriod: {
          start: newShift.startTime,
          end: newShift.endTime,
        },
      });
    }

    // Check total hours in the 24-hour period containing this shift
    const dayStart = new Date(newShift.startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = addDays(dayStart, 1);

    const shiftsInDay = existingShifts.filter(
      (s) =>
        s.userId === newShift.userId &&
        isWithinInterval(s.startTime, { start: dayStart, end: dayEnd })
    );

    const totalDailyHours = shiftsInDay.reduce(
      (sum, shift) => sum + this.calculateShiftHours(shift),
      newShiftHours
    );

    if (totalDailyHours > this.config.maxDailyHours) {
      violations.push({
        type: 'DAILY',
        violation: `Total daily hours exceed limit: ${totalDailyHours.toFixed(1)} hours (maximum ${this.config.maxDailyHours} hours)`,
        limit: this.config.maxDailyHours,
        actual: totalDailyHours,
        affectedPeriod: {
          start: dayStart,
          end: dayEnd,
        },
      });
    }

    return violations;
  }

  /**
   * Validates weekly working hours limit (40 hours per 7-day period)
   */
  validateWeeklyHours(
    newShift: ShiftData,
    existingShifts: ShiftData[]
  ): WorkingHoursViolation[] {
    const violations: WorkingHoursViolation[] = [];

    // Calculate hours in rolling 7-day window
    const weekStart = new Date(newShift.startTime);
    const weekEnd = addDays(weekStart, 7);

    const shiftsInWeek = existingShifts.filter(
      (s) =>
        s.userId === newShift.userId &&
        isWithinInterval(s.startTime, { start: weekStart, end: weekEnd })
    );

    const newShiftHours = this.calculateShiftHours(newShift);
    const totalWeeklyHours = shiftsInWeek.reduce(
      (sum, shift) => sum + this.calculateShiftHours(shift),
      newShiftHours
    );

    if (totalWeeklyHours > this.config.maxWeeklyHours) {
      violations.push({
        type: 'WEEKLY',
        violation: `Weekly hours exceed limit: ${totalWeeklyHours.toFixed(1)} hours (maximum ${this.config.maxWeeklyHours} hours)`,
        limit: this.config.maxWeeklyHours,
        actual: totalWeeklyHours,
        affectedPeriod: {
          start: weekStart,
          end: weekEnd,
        },
      });
    }

    return violations;
  }

  /**
   * Calculate overtime hours for a shift
   */
  private calculateOvertimeHours(shift: ShiftData, normalHours: number): number {
    const totalHours = this.calculateShiftHours(shift);
    return Math.max(0, totalHours - normalHours);
  }

  /**
   * Validates overtime limits
   */
  validateOvertimeLimits(
    userId: string,
    allShifts: ShiftData[],
    referenceDate: Date
  ): WorkingHoursViolation[] {
    const violations: WorkingHoursViolation[] = [];
    const userShifts = allShifts.filter((s) => s.userId === userId);

    // Weekly overtime limit (10 hours per week)
    const weekStart = new Date(referenceDate);
    const weekEnd = addDays(weekStart, 7);
    const weekShifts = userShifts.filter((s) =>
      isWithinInterval(s.startTime, { start: weekStart, end: weekEnd })
    );

    let weeklyOvertimeHours = 0;
    weekShifts.forEach((shift) => {
      const hours = this.calculateShiftHours(shift);
      // Simple calculation: hours beyond normal daily limit count as overtime
      if (hours > this.config.maxDailyHours) {
        weeklyOvertimeHours += hours - this.config.maxDailyHours;
      }
    });

    if (weeklyOvertimeHours > this.config.maxOvertimePerWeek) {
      violations.push({
        type: 'OVERTIME_WEEKLY',
        violation: `Weekly overtime exceeds limit: ${weeklyOvertimeHours.toFixed(1)} hours (maximum ${this.config.maxOvertimePerWeek} hours)`,
        limit: this.config.maxOvertimePerWeek,
        actual: weeklyOvertimeHours,
        affectedPeriod: {
          start: weekStart,
          end: weekEnd,
        },
      });
    }

    // 4-week overtime limit (25 hours per 4 weeks)
    const fourWeeksStart = new Date(referenceDate);
    const fourWeeksEnd = addWeeks(fourWeeksStart, 4);
    const fourWeekShifts = userShifts.filter((s) =>
      isWithinInterval(s.startTime, { start: fourWeeksStart, end: fourWeeksEnd })
    );

    let fourWeekOvertimeHours = 0;
    fourWeekShifts.forEach((shift) => {
      const hours = this.calculateShiftHours(shift);
      if (hours > this.config.maxDailyHours) {
        fourWeekOvertimeHours += hours - this.config.maxDailyHours;
      }
    });

    if (fourWeekOvertimeHours > this.config.maxOvertimePer4Weeks) {
      violations.push({
        type: 'OVERTIME_4WEEKS',
        violation: `4-week overtime exceeds limit: ${fourWeekOvertimeHours.toFixed(1)} hours (maximum ${this.config.maxOvertimePer4Weeks} hours)`,
        limit: this.config.maxOvertimePer4Weeks,
        actual: fourWeekOvertimeHours,
        affectedPeriod: {
          start: fourWeeksStart,
          end: fourWeeksEnd,
        },
      });
    }

    // Yearly overtime limit (200 hours per year)
    const yearStart = subYears(referenceDate, 1);
    const yearShifts = userShifts.filter((s) =>
      isWithinInterval(s.startTime, { start: yearStart, end: referenceDate })
    );

    let yearlyOvertimeHours = 0;
    yearShifts.forEach((shift) => {
      const hours = this.calculateShiftHours(shift);
      if (hours > this.config.maxDailyHours) {
        yearlyOvertimeHours += hours - this.config.maxDailyHours;
      }
    });

    if (yearlyOvertimeHours > this.config.maxOvertimePerYear) {
      violations.push({
        type: 'OVERTIME_YEARLY',
        violation: `Yearly overtime exceeds limit: ${yearlyOvertimeHours.toFixed(1)} hours (maximum ${this.config.maxOvertimePerYear} hours)`,
        limit: this.config.maxOvertimePerYear,
        actual: yearlyOvertimeHours,
        affectedPeriod: {
          start: yearStart,
          end: referenceDate,
        },
      });
    }

    return violations;
  }

  /**
   * Comprehensive validation of all working hours requirements
   */
  validateAllWorkingHours(
    newShift: ShiftData,
    existingShifts: ShiftData[]
  ): WorkingHoursViolation[] {
    const violations: WorkingHoursViolation[] = [];

    // Validate daily hours
    violations.push(...this.validateDailyHours(newShift, existingShifts));

    // Validate weekly hours
    violations.push(...this.validateWeeklyHours(newShift, existingShifts));

    // Validate overtime limits
    violations.push(
      ...this.validateOvertimeLimits(
        newShift.userId,
        [...existingShifts, newShift],
        newShift.startTime
      )
    );

    return violations;
  }
}
