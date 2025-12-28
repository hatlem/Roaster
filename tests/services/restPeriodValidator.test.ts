// Unit tests for Rest Period Validator

import { RestPeriodValidator } from '../../src/services/restPeriodValidator';
import { ComplianceConfig, ShiftData } from '../../src/types';

describe('RestPeriodValidator', () => {
  let validator: RestPeriodValidator;
  const config: ComplianceConfig = {
    maxDailyHours: 9,
    maxWeeklyHours: 40,
    minDailyRest: 11,
    minWeeklyRest: 35,
    publishDeadlineDays: 14,
    maxOvertimePerWeek: 10,
    maxOvertimePer4Weeks: 25,
    maxOvertimePerYear: 200,
  };

  beforeEach(() => {
    validator = new RestPeriodValidator(config);
  });

  describe('validateDailyRest', () => {
    it('should pass when there is sufficient rest between shifts', () => {
      const existingShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T16:00:00Z'),
        breakMinutes: 30,
      };

      const newShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-16T08:00:00Z'),
        endTime: new Date('2024-01-16T16:00:00Z'),
        breakMinutes: 30,
      };

      const violations = validator.validateDailyRest(newShift, [existingShift]);

      expect(violations).toHaveLength(0);
    });

    it('should detect violation when rest is less than 11 hours', () => {
      const existingShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T22:00:00Z'), // Ends at 22:00
        breakMinutes: 30,
      };

      const newShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-16T06:00:00Z'), // Starts at 06:00 (only 8 hours rest)
        endTime: new Date('2024-01-16T14:00:00Z'),
        breakMinutes: 30,
      };

      const violations = validator.validateDailyRest(newShift, [existingShift]);

      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('DAILY');
      expect(violations[0].requiredRest).toBe(11);
      expect(violations[0].actualRest).toBe(8);
    });

    it('should check rest before new shift', () => {
      const existingShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-15T20:00:00Z'),
        endTime: new Date('2024-01-15T23:00:00Z'),
        breakMinutes: 0,
      };

      const newShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-16T08:00:00Z'), // 9 hours rest
        endTime: new Date('2024-01-16T16:00:00Z'),
        breakMinutes: 30,
      };

      const violations = validator.validateDailyRest(newShift, [existingShift]);

      expect(violations).toHaveLength(1);
      expect(violations[0].actualRest).toBe(9);
    });

    it('should check rest after new shift', () => {
      const existingShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-16T08:00:00Z'),
        endTime: new Date('2024-01-16T16:00:00Z'),
        breakMinutes: 30,
      };

      const newShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-15T20:00:00Z'),
        endTime: new Date('2024-01-15T23:00:00Z'), // 9 hours before next shift
        breakMinutes: 0,
      };

      const violations = validator.validateDailyRest(newShift, [existingShift]);

      expect(violations).toHaveLength(1);
    });
  });

  describe('validateWeeklyRest', () => {
    it('should pass when there is 35+ hours continuous rest in week', () => {
      const shifts: ShiftData[] = [
        {
          userId: 'user-1',
          startTime: new Date('2024-01-15T08:00:00Z'), // Monday
          endTime: new Date('2024-01-15T16:00:00Z'),
          breakMinutes: 30,
        },
        {
          userId: 'user-1',
          startTime: new Date('2024-01-16T08:00:00Z'), // Tuesday
          endTime: new Date('2024-01-16T16:00:00Z'),
          breakMinutes: 30,
        },
        {
          userId: 'user-1',
          startTime: new Date('2024-01-17T08:00:00Z'), // Wednesday
          endTime: new Date('2024-01-17T16:00:00Z'),
          breakMinutes: 30,
        },
        {
          userId: 'user-1',
          startTime: new Date('2024-01-18T08:00:00Z'), // Thursday
          endTime: new Date('2024-01-18T16:00:00Z'),
          breakMinutes: 30,
        },
        {
          userId: 'user-1',
          startTime: new Date('2024-01-19T08:00:00Z'), // Friday
          endTime: new Date('2024-01-19T16:00:00Z'),
          breakMinutes: 30,
        },
        // Weekend off - 40 hours rest from Friday 16:00 to Monday 08:00
      ];

      const violations = validator.validateWeeklyRest(
        'user-1',
        shifts,
        new Date('2024-01-15T00:00:00Z'),
        new Date('2024-01-22T00:00:00Z')
      );

      expect(violations).toHaveLength(0);
    });

    it('should detect violation when no 35-hour rest period exists', () => {
      // Working every day with minimal rest
      const shifts: ShiftData[] = [];
      for (let day = 15; day <= 21; day++) {
        shifts.push({
          userId: 'user-1',
          startTime: new Date(`2024-01-${day}T08:00:00Z`),
          endTime: new Date(`2024-01-${day}T20:00:00Z`), // 12-hour shifts
          breakMinutes: 30,
        });
      }

      const violations = validator.validateWeeklyRest(
        'user-1',
        shifts,
        new Date('2024-01-15T00:00:00Z'),
        new Date('2024-01-22T00:00:00Z')
      );

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('WEEKLY');
      expect(violations[0].actualRest).toBeLessThan(35);
    });
  });

  describe('validateAllRestPeriods', () => {
    it('should validate both daily and weekly rest', () => {
      const existingShifts: ShiftData[] = [
        {
          userId: 'user-1',
          startTime: new Date('2024-01-15T08:00:00Z'),
          endTime: new Date('2024-01-15T22:00:00Z'),
          breakMinutes: 30,
        },
      ];

      const newShift: ShiftData = {
        userId: 'user-1',
        startTime: new Date('2024-01-16T06:00:00Z'),
        endTime: new Date('2024-01-16T14:00:00Z'),
        breakMinutes: 30,
      };

      const violations = validator.validateAllRestPeriods(
        newShift,
        existingShifts,
        new Date('2024-01-15T00:00:00Z'),
        new Date('2024-01-22T00:00:00Z')
      );

      // Should have at least daily rest violation
      expect(violations.length).toBeGreaterThan(0);
      const dailyViolations = violations.filter((v) => v.type === 'DAILY');
      expect(dailyViolations).toHaveLength(1);
    });
  });
});
