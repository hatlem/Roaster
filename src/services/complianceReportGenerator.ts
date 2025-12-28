// Compliance Report Generator for Arbeidstilsynet
// Generates detailed reports showing planned vs actual hours worked
// Must include data for at least 2 years as required by law

import { PrismaClient } from '@prisma/client';
import { differenceInHours, format } from 'date-fns';

const prisma = new PrismaClient();

export interface EmployeeWorkSummary {
  userId: string;
  employeeName: string;
  employeeNumber?: string;
  department?: string;
  totalPlannedHours: number;
  totalActualHours: number;
  totalOvertimeHours: number;
  violations: ComplianceViolation[];
  shifts: ShiftSummary[];
}

export interface ShiftSummary {
  date: string;
  startTime: string;
  endTime: string;
  plannedHours: number;
  actualHours?: number;
  isOvertime: boolean;
  violations: string[];
}

export interface ComplianceViolation {
  date: string;
  type: string;
  description: string;
  severity: 'WARNING' | 'VIOLATION';
}

export interface ArbeidstilsynetReport {
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  organizationName: string;
  organizationNumber: string;
  employees: EmployeeWorkSummary[];
  summary: {
    totalEmployees: number;
    totalPlannedHours: number;
    totalActualHours: number;
    totalViolations: number;
    latePublications: number;
  };
}

export class ComplianceReportGenerator {
  /**
   * Generate comprehensive report for Arbeidstilsynet inspection
   */
  async generateArbeidstilsynetReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ArbeidstilsynetReport> {
    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get all rosters in the period
    const rosters = await prisma.roster.findMany({
      where: {
        organizationId,
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
      include: {
        shifts: {
          include: {
            user: true,
          },
        },
      },
    });

    // Get all actual hours in the period
    const actualHours = await prisma.actualHours.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: true,
      },
    });

    // Get all users who worked in this period
    const userIds = new Set<string>();
    rosters.forEach((roster) => {
      roster.shifts.forEach((shift) => userIds.add(shift.userId));
    });
    actualHours.forEach((ah) => userIds.add(ah.userId));

    // Build employee summaries
    const employees: EmployeeWorkSummary[] = [];

    for (const userId of userIds) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) continue;

      const userShifts = rosters.flatMap((roster) =>
        roster.shifts.filter((shift) => shift.userId === userId)
      );

      const userActualHours = actualHours.filter((ah) => ah.userId === userId);

      const shifts: ShiftSummary[] = userShifts.map((shift) => {
        const plannedHours =
          (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60) -
          shift.breakMinutes / 60;

        const actualHour = userActualHours.find(
          (ah) => format(ah.date, 'yyyy-MM-dd') === format(shift.startTime, 'yyyy-MM-dd')
        );

        const violations: string[] = [];
        if (shift.violatesRestPeriod) violations.push('Rest period violation');
        if (shift.violatesDailyLimit) violations.push('Daily hours limit exceeded');
        if (shift.violatesWeeklyLimit) violations.push('Weekly hours limit exceeded');

        return {
          date: format(shift.startTime, 'yyyy-MM-dd'),
          startTime: format(shift.startTime, 'HH:mm'),
          endTime: format(shift.endTime, 'HH:mm'),
          plannedHours: Math.round(plannedHours * 10) / 10,
          actualHours: actualHour ? actualHour.totalHours : undefined,
          isOvertime: shift.isOvertime,
          violations,
        };
      });

      const totalPlannedHours = shifts.reduce((sum, s) => sum + s.plannedHours, 0);
      const totalActualHours = shifts.reduce(
        (sum, s) => sum + (s.actualHours || 0),
        0
      );
      const totalOvertimeHours = userActualHours.reduce(
        (sum, ah) => sum + ah.overtimeHours,
        0
      );

      const violations: ComplianceViolation[] = userShifts
        .filter(
          (shift) =>
            shift.violatesRestPeriod ||
            shift.violatesDailyLimit ||
            shift.violatesWeeklyLimit
        )
        .map((shift) => ({
          date: format(shift.startTime, 'yyyy-MM-dd'),
          type: shift.violatesRestPeriod
            ? 'REST_PERIOD'
            : shift.violatesDailyLimit
            ? 'DAILY_LIMIT'
            : 'WEEKLY_LIMIT',
          description: shift.violatesRestPeriod
            ? 'Insufficient rest period between shifts'
            : shift.violatesDailyLimit
            ? 'Daily working hours limit exceeded'
            : 'Weekly working hours limit exceeded',
          severity: 'VIOLATION' as const,
        }));

      employees.push({
        userId: user.id,
        employeeName: `${user.firstName} ${user.lastName}`,
        employeeNumber: user.employeeNumber || undefined,
        department: user.department || undefined,
        totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
        totalActualHours: Math.round(totalActualHours * 10) / 10,
        totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
        violations,
        shifts,
      });
    }

    // Count late publications
    const latePublications = rosters.filter((r) => r.isLatePublication).length;

    // Build summary
    const summary = {
      totalEmployees: employees.length,
      totalPlannedHours: Math.round(
        employees.reduce((sum, e) => sum + e.totalPlannedHours, 0) * 10
      ) / 10,
      totalActualHours: Math.round(
        employees.reduce((sum, e) => sum + e.totalActualHours, 0) * 10
      ) / 10,
      totalViolations: employees.reduce((sum, e) => sum + e.violations.length, 0),
      latePublications,
    };

    return {
      generatedAt: new Date().toISOString(),
      periodStart: format(startDate, 'yyyy-MM-dd'),
      periodEnd: format(endDate, 'yyyy-MM-dd'),
      organizationName: organization.name,
      organizationNumber: organization.orgNumber,
      employees,
      summary,
    };
  }

  /**
   * Save report to database
   */
  async saveReport(
    organizationId: string,
    report: ArbeidstilsynetReport,
    userId: string
  ): Promise<string> {
    const complianceReport = await prisma.complianceReport.create({
      data: {
        startDate: new Date(report.periodStart),
        endDate: new Date(report.periodEnd),
        reportType: 'ARBEIDSTILSYNET',
        generatedBy: userId,
        data: report as any,
      },
    });

    return complianceReport.id;
  }

  /**
   * Export report as JSON for download
   */
  exportAsJSON(report: ArbeidstilsynetReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate CSV export (simplified format)
   */
  exportAsCSV(report: ArbeidstilsynetReport): string {
    const headers = [
      'Employee Name',
      'Employee Number',
      'Department',
      'Date',
      'Start Time',
      'End Time',
      'Planned Hours',
      'Actual Hours',
      'Overtime',
      'Violations',
    ];

    const rows = report.employees.flatMap((employee) =>
      employee.shifts.map((shift) => [
        employee.employeeName,
        employee.employeeNumber || '',
        employee.department || '',
        shift.date,
        shift.startTime,
        shift.endTime,
        shift.plannedHours.toString(),
        shift.actualHours?.toString() || '',
        shift.isOvertime ? 'Yes' : 'No',
        shift.violations.join('; '),
      ])
    );

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
}
