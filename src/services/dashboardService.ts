// Dashboard & Analytics Service
// Provides real-time metrics and KPIs for management

import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, differenceInMinutes } from 'date-fns';
import { DashboardMetrics } from '../types/index.enhanced';
import { LaborCostCalculator } from './laborCostCalculator';
import { getComplianceConfig } from '../config/compliance';

const prisma = new PrismaClient();

export class DashboardService {
  private laborCostCalculator: LaborCostCalculator;

  constructor() {
    const config = getComplianceConfig();
    this.laborCostCalculator = new LaborCostCalculator(config);
  }

  /**
   * Get dashboard metrics for a period
   */
  async getDashboardMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetrics> {
    const [
      laborMetrics,
      complianceMetrics,
      attendanceMetrics,
      overtimeMetrics,
    ] = await Promise.all([
      this.getLaborMetrics(organizationId, startDate, endDate),
      this.getComplianceMetrics(organizationId, startDate, endDate),
      this.getAttendanceMetrics(organizationId, startDate, endDate),
      this.getOvertimeMetrics(organizationId, startDate, endDate),
    ]);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      labor: laborMetrics,
      compliance: complianceMetrics,
      attendance: attendanceMetrics,
      overtime: overtimeMetrics,
    };
  }

  /**
   * Get labor cost metrics
   */
  private async getLaborMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const rosters = await prisma.roster.findMany({
      where: {
        organizationId,
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
      include: {
        shifts: {
          include: { user: true },
        },
      },
    });

    const actualHoursData = await prisma.actualHours.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate scheduled costs
    const allShifts = rosters.flatMap((r) => r.shifts);
    const scheduledShifts = allShifts.map((shift) => ({
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      userId: shift.userId,
      hourlyRate: 200, // TODO: Get from user.hourlyRate
    }));

    const scheduledCost = this.laborCostCalculator.calculateTotalCost(scheduledShifts);

    // Calculate actual costs
    const actualHours = actualHoursData.reduce((sum, ah) => sum + ah.totalHours, 0);
    const actualCost = actualHoursData.reduce((sum, ah) => sum + (ah.totalHours * 200), 0);

    // Budget (simplified - should come from organization settings)
    const budgetedHours = scheduledCost.totalHours * 0.95; // 5% under scheduled
    const budgetedCost = scheduledCost.totalCost * 0.95;

    const variance = actualCost - budgetedCost;
    const variancePercentage = budgetedCost > 0 ? (variance / budgetedCost) * 100 : 0;

    return {
      budgetedHours: Math.round(budgetedHours * 100) / 100,
      scheduledHours: Math.round(scheduledCost.totalHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100,
      budgetedCost: Math.round(budgetedCost * 100) / 100,
      scheduledCost: Math.round(scheduledCost.totalCost * 100) / 100,
      actualCost: Math.round(actualCost * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      variancePercentage: Math.round(variancePercentage * 10) / 10,
    };
  }

  /**
   * Get compliance metrics
   */
  private async getComplianceMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const rosters = await prisma.roster.findMany({
      where: {
        organizationId,
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
      include: {
        shifts: true,
      },
    });

    const totalShifts = rosters.reduce((sum, r) => sum + r.shifts.length, 0);
    const compliantShifts = rosters.reduce(
      (sum, r) =>
        sum +
        r.shifts.filter(
          (s) =>
            !s.violatesRestPeriod && !s.violatesDailyLimit && !s.violatesWeeklyLimit
        ).length,
      0
    );
    const shiftsWithViolations = rosters.reduce(
      (sum, r) =>
        sum +
        r.shifts.filter(
          (s) =>
            s.violatesRestPeriod || s.violatesDailyLimit || s.violatesWeeklyLimit
        ).length,
      0
    );
    const shiftsWithWarnings = totalShifts - compliantShifts - shiftsWithViolations;

    const latePublications = rosters.filter((r) => r.isLatePublication).length;

    const complianceRate =
      totalShifts > 0 ? (compliantShifts / totalShifts) * 100 : 100;

    return {
      totalShifts,
      compliantShifts,
      shiftsWithWarnings,
      shiftsWithViolations,
      complianceRate: Math.round(complianceRate * 10) / 10,
      latePublications,
    };
  }

  /**
   * Get attendance metrics
   */
  private async getAttendanceMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const rosters = await prisma.roster.findMany({
      where: {
        organizationId,
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
      include: {
        shifts: true,
      },
    });

    const actualHoursData = await prisma.actualHours.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalShifts = rosters.reduce((sum, r) => sum + r.shifts.length, 0);
    const completedShifts = actualHoursData.length;
    const missedShifts = Math.max(0, totalShifts - completedShifts);
    const lateShifts = 0; // TODO: Track from actual clock-in times

    const attendanceRate =
      totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 100;

    return {
      totalShifts,
      completedShifts,
      missedShifts,
      lateShifts,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    };
  }

  /**
   * Get overtime metrics
   */
  private async getOvertimeMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const actualHoursData = await prisma.actualHours.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalOvertimeHours = actualHoursData.reduce(
      (sum, ah) => sum + ah.overtimeHours,
      0
    );

    // Calculate overtime cost (40% premium minimum in Norway)
    const overtimeCost = totalOvertimeHours * 200 * 1.4; // TODO: Use actual rates

    const employeesWithOvertime = new Set(
      actualHoursData.filter((ah) => ah.overtimeHours > 0).map((ah) => ah.userId)
    ).size;

    const averageOvertimePerEmployee =
      employeesWithOvertime > 0 ? totalOvertimeHours / employeesWithOvertime : 0;

    return {
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      overtimeCost: Math.round(overtimeCost * 100) / 100,
      employeesWithOvertime,
      averageOvertimePerEmployee: Math.round(averageOvertimePerEmployee * 10) / 10,
    };
  }

  /**
   * Get week-over-week comparison
   */
  async getWeeklyComparison(organizationId: string, targetDate: Date) {
    const thisWeekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekEnd);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const [thisWeek, lastWeek] = await Promise.all([
      this.getDashboardMetrics(organizationId, thisWeekStart, thisWeekEnd),
      this.getDashboardMetrics(organizationId, lastWeekStart, lastWeekEnd),
    ]);

    return {
      thisWeek,
      lastWeek,
      changes: {
        laborCost: thisWeek.labor.actualCost - lastWeek.labor.actualCost,
        complianceRate: thisWeek.compliance.complianceRate - lastWeek.compliance.complianceRate,
        attendanceRate: thisWeek.attendance.attendanceRate - lastWeek.attendance.attendanceRate,
        overtimeHours: thisWeek.overtime.totalOvertimeHours - lastWeek.overtime.totalOvertimeHours,
      },
    };
  }
}
