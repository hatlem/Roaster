// Labor Cost Calculator Service
// Calculates labor costs including overtime premiums per Norwegian law

import { differenceInMinutes } from 'date-fns';
import { ShiftData, LaborCost } from '../types/index.enhanced';
import { ComplianceConfig } from '../types';

export class LaborCostCalculator {
  // Norwegian law requires minimum 40% overtime premium
  private readonly overtimeMultiplier = 1.4;

  constructor(private config: ComplianceConfig) {}

  /**
   * Calculate labor cost for a single shift
   */
  calculateShiftCost(shift: ShiftData): LaborCost {
    const totalMinutes = differenceInMinutes(shift.endTime, shift.startTime);
    const workingMinutes = totalMinutes - shift.breakMinutes;
    const totalHours = workingMinutes / 60;

    const hourlyRate = shift.hourlyRate || 0;

    // Determine regular vs overtime hours
    const regularHours = Math.min(totalHours, this.config.maxDailyHours);
    const overtimeHours = Math.max(0, totalHours - this.config.maxDailyHours);

    // Calculate costs
    const regularCost = regularHours * hourlyRate;
    const overtimeCost = overtimeHours * hourlyRate * this.overtimeMultiplier;
    const totalCost = regularCost + overtimeCost;

    return {
      hourlyRate,
      totalHours: Math.round(totalHours * 100) / 100,
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      regularCost: Math.round(regularCost * 100) / 100,
      overtimeCost: Math.round(overtimeCost * 100) / 100,
      overtimeMultiplier: this.overtimeMultiplier,
    };
  }

  /**
   * Calculate total labor cost for multiple shifts
   */
  calculateTotalCost(shifts: ShiftData[]): LaborCost {
    const costs = shifts.map((shift) => this.calculateShiftCost(shift));

    return {
      hourlyRate: 0, // Average or weighted average could be calculated
      totalHours: costs.reduce((sum, c) => sum + c.totalHours, 0),
      regularHours: costs.reduce((sum, c) => sum + c.regularHours, 0),
      overtimeHours: costs.reduce((sum, c) => sum + c.overtimeHours, 0),
      totalCost: costs.reduce((sum, c) => sum + c.totalCost, 0),
      regularCost: costs.reduce((sum, c) => sum + c.regularCost, 0),
      overtimeCost: costs.reduce((sum, c) => sum + c.overtimeCost, 0),
      overtimeMultiplier: this.overtimeMultiplier,
    };
  }

  /**
   * Calculate labor cost budget vs actual variance
   */
  calculateVariance(budgeted: number, actual: number): {
    variance: number;
    variancePercentage: number;
    isOverBudget: boolean;
  } {
    const variance = actual - budgeted;
    const variancePercentage = budgeted > 0 ? (variance / budgeted) * 100 : 0;

    return {
      variance: Math.round(variance * 100) / 100,
      variancePercentage: Math.round(variancePercentage * 10) / 10,
      isOverBudget: variance > 0,
    };
  }

  /**
   * Estimate weekly labor cost from schedule
   */
  estimateWeeklyCost(shifts: ShiftData[]): {
    estimatedCost: number;
    breakdown: {
      regularCost: number;
      overtimeCost: number;
      totalHours: number;
    };
  } {
    const cost = this.calculateTotalCost(shifts);

    return {
      estimatedCost: cost.totalCost,
      breakdown: {
        regularCost: cost.regularCost,
        overtimeCost: cost.overtimeCost,
        totalHours: cost.totalHours,
      },
    };
  }
}
