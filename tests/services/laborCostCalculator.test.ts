// Unit tests for Labor Cost Calculator
// Tests cost calculations including Norwegian 40% overtime premium

import { LaborCostCalculator } from '../../src/services/laborCostCalculator';
import { ComplianceConfig } from '../../src/types';
import { ShiftData } from '../../src/types/index.enhanced';

describe('LaborCostCalculator', () => {
  let calculator: LaborCostCalculator;
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
    calculator = new LaborCostCalculator(config);
  });

  describe('calculateShiftCost', () => {
    it('should calculate cost for regular hours only', () => {
      const shift: ShiftData = {
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T16:00:00Z'), // 8 hours
        breakMinutes: 30,
        userId: 'user-1',
        hourlyRate: 200,
      };

      const result = calculator.calculateShiftCost(shift);

      expect(result.totalHours).toBe(7.5); // 8 hours - 0.5 break
      expect(result.regularHours).toBe(7.5); // All regular (under 9h)
      expect(result.overtimeHours).toBe(0);
      expect(result.regularCost).toBe(1500); // 7.5 * 200
      expect(result.overtimeCost).toBe(0);
      expect(result.totalCost).toBe(1500);
      expect(result.overtimeMultiplier).toBe(1.4);
    });

    it('should calculate cost with overtime (Norwegian 40% premium)', () => {
      const shift: ShiftData = {
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T19:00:00Z'), // 11 hours
        breakMinutes: 30,
        userId: 'user-1',
        hourlyRate: 200,
      };

      const result = calculator.calculateShiftCost(shift);

      expect(result.totalHours).toBe(10.5); // 11 hours - 0.5 break
      expect(result.regularHours).toBe(9); // Max daily hours
      expect(result.overtimeHours).toBe(1.5); // 10.5 - 9
      expect(result.regularCost).toBe(1800); // 9 * 200
      expect(result.overtimeCost).toBe(420); // 1.5 * 200 * 1.4
      expect(result.totalCost).toBe(2220); // 1800 + 420
    });

    it('should handle zero hourly rate', () => {
      const shift: ShiftData = {
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T16:00:00Z'),
        breakMinutes: 30,
        userId: 'user-1',
        hourlyRate: 0,
      };

      const result = calculator.calculateShiftCost(shift);

      expect(result.totalHours).toBe(7.5);
      expect(result.totalCost).toBe(0);
      expect(result.regularCost).toBe(0);
      expect(result.overtimeCost).toBe(0);
    });

    it('should handle shifts with no breaks', () => {
      const shift: ShiftData = {
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T12:00:00Z'), // 4 hours
        breakMinutes: 0,
        userId: 'user-1',
        hourlyRate: 250,
      };

      const result = calculator.calculateShiftCost(shift);

      expect(result.totalHours).toBe(4);
      expect(result.regularHours).toBe(4);
      expect(result.overtimeHours).toBe(0);
      expect(result.totalCost).toBe(1000); // 4 * 250
    });

    it('should round calculations to 2 decimal places', () => {
      const shift: ShiftData = {
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T16:20:00Z'), // 8h 20min
        breakMinutes: 25,
        userId: 'user-1',
        hourlyRate: 175,
      };

      const result = calculator.calculateShiftCost(shift);

      // 8.33 hours - 0.42 break = 7.92 hours (approximately)
      expect(result.totalHours).toBeCloseTo(7.92, 2);
      expect(result.regularHours).toBeCloseTo(7.92, 2);
      expect(result.totalCost).toBeCloseTo(1385.83, 2);
    });
  });

  describe('calculateTotalCost', () => {
    it('should aggregate costs from multiple shifts', () => {
      const shifts: ShiftData[] = [
        {
          startTime: new Date('2024-01-15T08:00:00Z'),
          endTime: new Date('2024-01-15T16:00:00Z'),
          breakMinutes: 30,
          userId: 'user-1',
          hourlyRate: 200,
        },
        {
          startTime: new Date('2024-01-16T08:00:00Z'),
          endTime: new Date('2024-01-16T17:00:00Z'),
          breakMinutes: 30,
          userId: 'user-1',
          hourlyRate: 200,
        },
        {
          startTime: new Date('2024-01-17T08:00:00Z'),
          endTime: new Date('2024-01-17T19:00:00Z'), // Overtime shift
          breakMinutes: 30,
          userId: 'user-1',
          hourlyRate: 200,
        },
      ];

      const result = calculator.calculateTotalCost(shifts);

      // Shift 1: 7.5h regular
      // Shift 2: 8.5h regular
      // Shift 3: 9h regular + 1.5h overtime
      expect(result.totalHours).toBe(25.5);
      expect(result.regularHours).toBe(25);
      expect(result.overtimeHours).toBe(1.5);
      expect(result.regularCost).toBe(5000); // 25 * 200
      expect(result.overtimeCost).toBe(420); // 1.5 * 200 * 1.4
      expect(result.totalCost).toBe(5420);
    });

    it('should handle empty shifts array', () => {
      const result = calculator.calculateTotalCost([]);

      expect(result.totalHours).toBe(0);
      expect(result.regularHours).toBe(0);
      expect(result.overtimeHours).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('should handle mixed hourly rates', () => {
      const shifts: ShiftData[] = [
        {
          startTime: new Date('2024-01-15T08:00:00Z'),
          endTime: new Date('2024-01-15T16:00:00Z'),
          breakMinutes: 30,
          userId: 'user-1',
          hourlyRate: 200,
        },
        {
          startTime: new Date('2024-01-16T08:00:00Z'),
          endTime: new Date('2024-01-16T16:00:00Z'),
          breakMinutes: 30,
          userId: 'user-2',
          hourlyRate: 250,
        },
      ];

      const result = calculator.calculateTotalCost(shifts);

      expect(result.totalHours).toBe(15);
      expect(result.regularCost).toBe(3375); // (7.5 * 200) + (7.5 * 250)
      expect(result.totalCost).toBe(3375);
    });
  });

  describe('calculateVariance', () => {
    it('should calculate positive variance when over budget', () => {
      const budgeted = 10000;
      const actual = 12000;

      const result = calculator.calculateVariance(budgeted, actual);

      expect(result.variance).toBe(2000);
      expect(result.variancePercentage).toBe(20);
      expect(result.isOverBudget).toBe(true);
    });

    it('should calculate negative variance when under budget', () => {
      const budgeted = 10000;
      const actual = 8500;

      const result = calculator.calculateVariance(budgeted, actual);

      expect(result.variance).toBe(-1500);
      expect(result.variancePercentage).toBe(-15);
      expect(result.isOverBudget).toBe(false);
    });

    it('should handle zero variance', () => {
      const budgeted = 10000;
      const actual = 10000;

      const result = calculator.calculateVariance(budgeted, actual);

      expect(result.variance).toBe(0);
      expect(result.variancePercentage).toBe(0);
      expect(result.isOverBudget).toBe(false);
    });

    it('should handle zero budget', () => {
      const budgeted = 0;
      const actual = 1000;

      const result = calculator.calculateVariance(budgeted, actual);

      expect(result.variance).toBe(1000);
      expect(result.variancePercentage).toBe(0);
      expect(result.isOverBudget).toBe(true);
    });

    it('should round variance percentage to one decimal place', () => {
      const budgeted = 9999;
      const actual = 10666;

      const result = calculator.calculateVariance(budgeted, actual);

      expect(result.variancePercentage).toBeCloseTo(6.7, 1);
    });
  });

  describe('estimateWeeklyCost', () => {
    it('should estimate weekly cost with breakdown', () => {
      const shifts: ShiftData[] = [
        {
          startTime: new Date('2024-01-15T08:00:00Z'),
          endTime: new Date('2024-01-15T17:00:00Z'),
          breakMinutes: 30,
          userId: 'user-1',
          hourlyRate: 200,
        },
        {
          startTime: new Date('2024-01-16T08:00:00Z'),
          endTime: new Date('2024-01-16T18:00:00Z'), // Overtime
          breakMinutes: 30,
          userId: 'user-1',
          hourlyRate: 200,
        },
      ];

      const result = calculator.estimateWeeklyCost(shifts);

      expect(result.breakdown.totalHours).toBeGreaterThan(0);
      expect(result.breakdown.regularCost).toBeGreaterThan(0);
      expect(result.breakdown.overtimeCost).toBeGreaterThan(0);
      expect(result.estimatedCost).toBe(
        result.breakdown.regularCost + result.breakdown.overtimeCost
      );
    });
  });

  describe('Norwegian overtime premium compliance', () => {
    it('should apply minimum 40% overtime premium', () => {
      const shift: ShiftData = {
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T20:00:00Z'), // 12 hours
        breakMinutes: 60,
        userId: 'user-1',
        hourlyRate: 300,
      };

      const result = calculator.calculateShiftCost(shift);

      // 11 working hours: 9 regular + 2 overtime
      expect(result.overtimeHours).toBe(2);
      expect(result.overtimeCost).toBe(840); // 2 * 300 * 1.4

      // Verify 40% premium is applied
      const baseCost = result.overtimeHours * (shift.hourlyRate || 0);
      const premium = result.overtimeCost - baseCost;
      expect(premium).toBe(240); // 40% of 600
    });

    it('should use 1.4 multiplier for all overtime calculations', () => {
      const shift: ShiftData = {
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T22:00:00Z'), // 14 hours
        breakMinutes: 60,
        userId: 'user-1',
        hourlyRate: 150,
      };

      const result = calculator.calculateShiftCost(shift);

      expect(result.overtimeMultiplier).toBe(1.4);
      expect(result.overtimeHours).toBe(4); // 13 working - 9 regular
      expect(result.overtimeCost).toBe(840); // 4 * 150 * 1.4
    });
  });
});
