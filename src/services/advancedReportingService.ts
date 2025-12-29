// Advanced Reporting Service
// Provides comprehensive reporting beyond basic dashboard

import { PrismaClient } from '@prisma/client';
import { format, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
import { LaborCostCalculator } from './laborCostCalculator';
import { ComplianceReportGenerator } from './complianceReportGenerator';
import { getComplianceConfig } from '../config/compliance';

const prisma = new PrismaClient();

// Report template definitions
export type ReportTemplateType =
  | 'compliance_summary'
  | 'labor_cost_analysis'
  | 'attendance_report'
  | 'overtime_report'
  | 'shift_coverage_report'
  | 'arbeidstilsynet_export'
  | 'employee_hours_summary';

export interface ReportTemplate {
  id: ReportTemplateType;
  name: string;
  description: string;
  category: 'compliance' | 'financial' | 'operational' | 'regulatory';
  requiredParams: string[];
  availableFilters: string[];
  supportedFormats: ('json' | 'csv' | 'pdf' | 'excel')[];
}

export interface ReportFilter {
  departmentIds?: string[];
  userIds?: string[];
  includeArchived?: boolean;
  shiftTypes?: string[];
  complianceStatus?: ('compliant' | 'warning' | 'violation')[];
  minHours?: number;
  maxHours?: number;
}

export interface GenerateReportRequest {
  templateId: ReportTemplateType;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  filters?: ReportFilter;
  includeCharts?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'employee' | 'department';
}

export interface ScheduledReport {
  id: string;
  templateId: ReportTemplateType;
  organizationId: string;
  name: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[]; // Email addresses
  filters?: ReportFilter;
  format: 'json' | 'csv' | 'pdf' | 'excel';
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface GeneratedReport {
  id: string;
  templateId: ReportTemplateType;
  templateName: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  generatedBy: string;
  filters?: ReportFilter;
  data: any;
  summary: ReportSummary;
  sharedWith?: string[]; // User IDs with access
}

export interface ReportSummary {
  totalRecords: number;
  keyMetrics: Record<string, number | string>;
  highlights: string[];
  warnings?: string[];
}

export class AdvancedReportingService {
  private laborCostCalculator: LaborCostCalculator;
  private complianceReportGenerator: ComplianceReportGenerator;

  constructor() {
    const config = getComplianceConfig();
    this.laborCostCalculator = new LaborCostCalculator(config);
    this.complianceReportGenerator = new ComplianceReportGenerator();
  }

  /**
   * Get all available report templates
   */
  getReportTemplates(): ReportTemplate[] {
    return [
      {
        id: 'compliance_summary',
        name: 'Compliance Summary',
        description: 'Overview of compliance violations, warnings, and compliance rates',
        category: 'compliance',
        requiredParams: ['organizationId', 'startDate', 'endDate'],
        availableFilters: ['departmentIds', 'complianceStatus'],
        supportedFormats: ['json', 'csv', 'pdf', 'excel'],
      },
      {
        id: 'labor_cost_analysis',
        name: 'Labor Cost Analysis',
        description: 'Budget vs actual costs, overtime breakdown, and cost trends',
        category: 'financial',
        requiredParams: ['organizationId', 'startDate', 'endDate'],
        availableFilters: ['departmentIds', 'userIds'],
        supportedFormats: ['json', 'csv', 'pdf', 'excel'],
      },
      {
        id: 'attendance_report',
        name: 'Attendance Report',
        description: 'Employee attendance by employee, department, and period',
        category: 'operational',
        requiredParams: ['organizationId', 'startDate', 'endDate'],
        availableFilters: ['departmentIds', 'userIds'],
        supportedFormats: ['json', 'csv', 'excel'],
      },
      {
        id: 'overtime_report',
        name: 'Overtime Report',
        description: 'Overtime hours, costs, and trends analysis',
        category: 'financial',
        requiredParams: ['organizationId', 'startDate', 'endDate'],
        availableFilters: ['departmentIds', 'userIds', 'minHours'],
        supportedFormats: ['json', 'csv', 'pdf', 'excel'],
      },
      {
        id: 'shift_coverage_report',
        name: 'Shift Coverage Report',
        description: 'Analysis of filled vs unfilled shifts and coverage gaps',
        category: 'operational',
        requiredParams: ['organizationId', 'startDate', 'endDate'],
        availableFilters: ['departmentIds', 'shiftTypes'],
        supportedFormats: ['json', 'csv', 'pdf'],
      },
      {
        id: 'arbeidstilsynet_export',
        name: 'Arbeidstilsynet Export',
        description: 'Compliance-ready export for Norwegian Labor Inspection Authority',
        category: 'regulatory',
        requiredParams: ['organizationId', 'startDate', 'endDate'],
        availableFilters: [],
        supportedFormats: ['json', 'csv'],
      },
      {
        id: 'employee_hours_summary',
        name: 'Employee Hours Summary',
        description: 'Summary of hours worked per employee for payroll processing',
        category: 'financial',
        requiredParams: ['organizationId', 'startDate', 'endDate'],
        availableFilters: ['departmentIds', 'userIds'],
        supportedFormats: ['json', 'csv', 'excel'],
      },
    ];
  }

  /**
   * Generate a report based on template and parameters
   */
  async generateReport(request: GenerateReportRequest, userId: string): Promise<GeneratedReport> {
    const template = this.getReportTemplates().find((t) => t.id === request.templateId);
    if (!template) {
      throw new Error(`Unknown report template: ${request.templateId}`);
    }

    let reportData: any;
    let summary: ReportSummary;

    switch (request.templateId) {
      case 'compliance_summary':
        ({ data: reportData, summary } = await this.generateComplianceSummary(request));
        break;
      case 'labor_cost_analysis':
        ({ data: reportData, summary } = await this.generateLaborCostAnalysis(request));
        break;
      case 'attendance_report':
        ({ data: reportData, summary } = await this.generateAttendanceReport(request));
        break;
      case 'overtime_report':
        ({ data: reportData, summary } = await this.generateOvertimeReport(request));
        break;
      case 'shift_coverage_report':
        ({ data: reportData, summary } = await this.generateShiftCoverageReport(request));
        break;
      case 'arbeidstilsynet_export':
        ({ data: reportData, summary } = await this.generateArbeidstilsynetExport(request));
        break;
      case 'employee_hours_summary':
        ({ data: reportData, summary } = await this.generateEmployeeHoursSummary(request));
        break;
      default:
        throw new Error(`Report generation not implemented for: ${request.templateId}`);
    }

    // Save report to database
    const savedReport = await prisma.complianceReport.create({
      data: {
        startDate: request.startDate,
        endDate: request.endDate,
        reportType: request.templateId.toUpperCase(),
        generatedBy: userId,
        data: {
          ...reportData,
          filters: request.filters,
          groupBy: request.groupBy,
          summary,
        },
      },
    });

    return {
      id: savedReport.id,
      templateId: request.templateId,
      templateName: template.name,
      organizationId: request.organizationId,
      startDate: request.startDate,
      endDate: request.endDate,
      generatedAt: savedReport.generatedAt,
      generatedBy: userId,
      filters: request.filters,
      data: reportData,
      summary,
    };
  }

  /**
   * Get a generated report by ID
   */
  async getReport(reportId: string): Promise<GeneratedReport | null> {
    const report = await prisma.complianceReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return null;
    }

    const reportData = report.data as any;
    const template = this.getReportTemplates().find(
      (t) => t.id === report.reportType.toLowerCase()
    );

    return {
      id: report.id,
      templateId: report.reportType.toLowerCase() as ReportTemplateType,
      templateName: template?.name || report.reportType,
      organizationId: reportData.organizationId || '',
      startDate: report.startDate,
      endDate: report.endDate,
      generatedAt: report.generatedAt,
      generatedBy: report.generatedBy,
      filters: reportData.filters,
      data: reportData,
      summary: reportData.summary || {
        totalRecords: 0,
        keyMetrics: {},
        highlights: [],
      },
    };
  }

  /**
   * Export report to specified format
   */
  async exportReport(
    reportId: string,
    format: 'json' | 'csv' | 'pdf' | 'excel'
  ): Promise<{ data: string | Buffer; filename: string; contentType: string }> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const dateStr = `${format(report.startDate, 'yyyy-MM-dd')}_${format(report.endDate, 'yyyy-MM-dd')}`;
    const baseFilename = `${report.templateId}_${dateStr}`;

    switch (format) {
      case 'json':
        return {
          data: JSON.stringify(report.data, null, 2),
          filename: `${baseFilename}.json`,
          contentType: 'application/json',
        };

      case 'csv':
        return {
          data: this.convertToCSV(report),
          filename: `${baseFilename}.csv`,
          contentType: 'text/csv',
        };

      case 'pdf':
        // Placeholder for PDF generation (would use library like pdfkit or puppeteer)
        return {
          data: JSON.stringify({ message: 'PDF generation not yet implemented', report: report.data }),
          filename: `${baseFilename}.pdf`,
          contentType: 'application/pdf',
        };

      case 'excel':
        // Placeholder for Excel generation (would use library like exceljs)
        return {
          data: JSON.stringify({ message: 'Excel generation not yet implemented', report: report.data }),
          filename: `${baseFilename}.xlsx`,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Schedule a recurring report
   */
  async scheduleReport(
    schedule: Omit<ScheduledReport, 'id' | 'createdAt' | 'lastRun' | 'nextRun'>
  ): Promise<ScheduledReport> {
    // In a real implementation, this would store in a ScheduledReport table
    // and use a job scheduler like Bull or node-cron
    const scheduledReport: ScheduledReport = {
      id: `sched_${Date.now()}`,
      ...schedule,
      createdAt: new Date(),
      nextRun: this.calculateNextRun(schedule.schedule),
    };

    // TODO: Store in database and register with job scheduler
    return scheduledReport;
  }

  /**
   * Get all scheduled reports for an organization
   */
  async getScheduledReports(organizationId: string): Promise<ScheduledReport[]> {
    // TODO: Retrieve from database
    // Placeholder implementation
    return [];
  }

  /**
   * Delete a scheduled report
   */
  async deleteScheduledReport(scheduleId: string): Promise<void> {
    // TODO: Remove from database and unregister from job scheduler
  }

  /**
   * Share report with users
   */
  async shareReport(reportId: string, userIds: string[]): Promise<void> {
    // TODO: Store sharing permissions in database
    // This would update a ComplianceReport.sharedWith field
  }

  // ===== Report Generation Methods =====

  private async generateComplianceSummary(
    request: GenerateReportRequest
  ): Promise<{ data: any; summary: ReportSummary }> {
    const rosters = await this.getRostersInPeriod(
      request.organizationId,
      request.startDate,
      request.endDate,
      request.filters
    );

    const shifts = rosters.flatMap((r) => r.shifts);
    const totalShifts = shifts.length;
    const compliantShifts = shifts.filter(
      (s) => !s.violatesRestPeriod && !s.violatesDailyLimit && !s.violatesWeeklyLimit
    ).length;
    const violationShifts = shifts.filter(
      (s) => s.violatesRestPeriod || s.violatesDailyLimit || s.violatesWeeklyLimit
    ).length;
    const warningShifts = totalShifts - compliantShifts - violationShifts;

    const complianceRate = totalShifts > 0 ? (compliantShifts / totalShifts) * 100 : 100;
    const latePublications = rosters.filter((r) => r.isLatePublication).length;

    const violationsByType = {
      restPeriod: shifts.filter((s) => s.violatesRestPeriod).length,
      dailyLimit: shifts.filter((s) => s.violatesDailyLimit).length,
      weeklyLimit: shifts.filter((s) => s.violatesWeeklyLimit).length,
    };

    const data = {
      organizationId: request.organizationId,
      period: { start: request.startDate, end: request.endDate },
      overview: {
        totalShifts,
        compliantShifts,
        shiftsWithWarnings: warningShifts,
        shiftsWithViolations: violationShifts,
        complianceRate: Math.round(complianceRate * 10) / 10,
        latePublications,
      },
      violationsByType,
      details: shifts
        .filter(
          (s) => s.violatesRestPeriod || s.violatesDailyLimit || s.violatesWeeklyLimit
        )
        .map((s) => ({
          date: format(s.startTime, 'yyyy-MM-dd'),
          employeeId: s.userId,
          violations: [
            s.violatesRestPeriod && 'Rest Period',
            s.violatesDailyLimit && 'Daily Limit',
            s.violatesWeeklyLimit && 'Weekly Limit',
          ].filter(Boolean),
        })),
    };

    const summary: ReportSummary = {
      totalRecords: totalShifts,
      keyMetrics: {
        complianceRate: `${Math.round(complianceRate)}%`,
        totalViolations: violationShifts,
        latePublications,
      },
      highlights: [
        `${compliantShifts} out of ${totalShifts} shifts are compliant`,
        `Compliance rate: ${Math.round(complianceRate)}%`,
        violationShifts > 0
          ? `⚠️ ${violationShifts} shifts have compliance violations`
          : '✓ No compliance violations',
      ],
      warnings:
        latePublications > 0
          ? [`${latePublications} roster(s) published late (14-day rule violation)`]
          : undefined,
    };

    return { data, summary };
  }

  private async generateLaborCostAnalysis(
    request: GenerateReportRequest
  ): Promise<{ data: any; summary: ReportSummary }> {
    const rosters = await this.getRostersInPeriod(
      request.organizationId,
      request.startDate,
      request.endDate,
      request.filters
    );

    const shifts = rosters.flatMap((r) => r.shifts);

    // Calculate scheduled costs
    const scheduledShifts = shifts.map((shift) => ({
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      userId: shift.userId,
      hourlyRate: 200, // TODO: Get from user.hourlyRate
    }));

    const scheduledCost = this.laborCostCalculator.calculateTotalCost(scheduledShifts);

    // Get actual hours
    const actualHoursData = await prisma.actualHours.findMany({
      where: {
        date: { gte: request.startDate, lte: request.endDate },
        ...(request.filters?.userIds && { userId: { in: request.filters.userIds } }),
      },
    });

    const actualHours = actualHoursData.reduce((sum, ah) => sum + ah.totalHours, 0);
    const actualCost = actualHoursData.reduce((sum, ah) => sum + ah.totalHours * 200, 0);

    // Budget (simplified)
    const budgetedCost = scheduledCost.totalCost * 0.95;
    const variance = actualCost - budgetedCost;
    const variancePercentage = budgetedCost > 0 ? (variance / budgetedCost) * 100 : 0;

    const overtimeBreakdown = {
      totalOvertimeHours: scheduledCost.overtimeHours,
      overtimeCost: scheduledCost.overtimeCost,
      overtimePercentage: scheduledCost.totalHours > 0
        ? (scheduledCost.overtimeHours / scheduledCost.totalHours) * 100
        : 0,
    };

    const data = {
      organizationId: request.organizationId,
      period: { start: request.startDate, end: request.endDate },
      budgetVsActual: {
        budgeted: Math.round(budgetedCost * 100) / 100,
        scheduled: Math.round(scheduledCost.totalCost * 100) / 100,
        actual: Math.round(actualCost * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variancePercentage: Math.round(variancePercentage * 10) / 10,
      },
      overtimeBreakdown: {
        ...overtimeBreakdown,
        overtimePercentage: Math.round(overtimeBreakdown.overtimePercentage * 10) / 10,
      },
      hoursSummary: {
        scheduledHours: Math.round(scheduledCost.totalHours * 100) / 100,
        actualHours: Math.round(actualHours * 100) / 100,
        regularHours: Math.round(scheduledCost.regularHours * 100) / 100,
        overtimeHours: Math.round(scheduledCost.overtimeHours * 100) / 100,
      },
    };

    const summary: ReportSummary = {
      totalRecords: shifts.length,
      keyMetrics: {
        totalCost: `${Math.round(actualCost)} NOK`,
        variance: `${variance > 0 ? '+' : ''}${Math.round(variance)} NOK`,
        variancePercentage: `${variance > 0 ? '+' : ''}${Math.round(variancePercentage)}%`,
      },
      highlights: [
        `Total labor cost: ${Math.round(actualCost)} NOK`,
        `Budget variance: ${variance > 0 ? '+' : ''}${Math.round(variance)} NOK (${Math.round(variancePercentage)}%)`,
        `Overtime: ${Math.round(scheduledCost.overtimeHours)} hours (${Math.round(overtimeBreakdown.overtimePercentage)}% of total)`,
      ],
      warnings: variance > budgetedCost * 0.1 ? ['Labor costs exceed budget by more than 10%'] : undefined,
    };

    return { data, summary };
  }

  private async generateAttendanceReport(
    request: GenerateReportRequest
  ): Promise<{ data: any; summary: ReportSummary }> {
    const rosters = await this.getRostersInPeriod(
      request.organizationId,
      request.startDate,
      request.endDate,
      request.filters
    );

    const shifts = rosters.flatMap((r) => r.shifts);
    const totalShifts = shifts.length;

    const actualHoursData = await prisma.actualHours.findMany({
      where: {
        date: { gte: request.startDate, lte: request.endDate },
        ...(request.filters?.userIds && { userId: { in: request.filters.userIds } }),
      },
      include: { user: true },
    });

    const completedShifts = actualHoursData.length;
    const missedShifts = Math.max(0, totalShifts - completedShifts);
    const attendanceRate = totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 100;

    // Group by employee
    const byEmployee = new Map<string, any>();
    for (const ah of actualHoursData) {
      if (!byEmployee.has(ah.userId)) {
        byEmployee.set(ah.userId, {
          userId: ah.userId,
          employeeName: `${ah.user.firstName} ${ah.user.lastName}`,
          department: ah.user.department,
          shiftsCompleted: 0,
          totalHours: 0,
        });
      }
      const emp = byEmployee.get(ah.userId);
      emp.shiftsCompleted++;
      emp.totalHours += ah.totalHours;
    }

    // Group by department if requested
    const byDepartment = new Map<string, any>();
    if (request.groupBy === 'department') {
      for (const [_, emp] of byEmployee) {
        const dept = emp.department || 'Unassigned';
        if (!byDepartment.has(dept)) {
          byDepartment.set(dept, {
            department: dept,
            employees: 0,
            shiftsCompleted: 0,
            totalHours: 0,
          });
        }
        const deptData = byDepartment.get(dept);
        deptData.employees++;
        deptData.shiftsCompleted += emp.shiftsCompleted;
        deptData.totalHours += emp.totalHours;
      }
    }

    const data = {
      organizationId: request.organizationId,
      period: { start: request.startDate, end: request.endDate },
      overview: {
        totalShifts,
        completedShifts,
        missedShifts,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      },
      byEmployee: Array.from(byEmployee.values()).map((emp) => ({
        ...emp,
        totalHours: Math.round(emp.totalHours * 100) / 100,
      })),
      ...(request.groupBy === 'department' && {
        byDepartment: Array.from(byDepartment.values()).map((dept) => ({
          ...dept,
          totalHours: Math.round(dept.totalHours * 100) / 100,
          avgHoursPerEmployee: Math.round((dept.totalHours / dept.employees) * 10) / 10,
        })),
      }),
    };

    const summary: ReportSummary = {
      totalRecords: byEmployee.size,
      keyMetrics: {
        attendanceRate: `${Math.round(attendanceRate)}%`,
        completedShifts,
        missedShifts,
      },
      highlights: [
        `${completedShifts} out of ${totalShifts} shifts completed`,
        `Attendance rate: ${Math.round(attendanceRate)}%`,
        `${byEmployee.size} employees tracked`,
      ],
      warnings: attendanceRate < 90 ? ['Attendance rate below 90%'] : undefined,
    };

    return { data, summary };
  }

  private async generateOvertimeReport(
    request: GenerateReportRequest
  ): Promise<{ data: any; summary: ReportSummary }> {
    const actualHoursData = await prisma.actualHours.findMany({
      where: {
        date: { gte: request.startDate, lte: request.endDate },
        overtimeHours: { gt: 0 },
        ...(request.filters?.userIds && { userId: { in: request.filters.userIds } }),
        ...(request.filters?.minHours && { overtimeHours: { gte: request.filters.minHours } }),
      },
      include: { user: true },
    });

    const totalOvertimeHours = actualHoursData.reduce((sum, ah) => sum + ah.overtimeHours, 0);
    const overtimeCost = totalOvertimeHours * 200 * 1.4; // 40% premium
    const employeesWithOvertime = new Set(actualHoursData.map((ah) => ah.userId)).size;

    // Group by employee
    const byEmployee = new Map<string, any>();
    for (const ah of actualHoursData) {
      if (!byEmployee.has(ah.userId)) {
        byEmployee.set(ah.userId, {
          userId: ah.userId,
          employeeName: `${ah.user.firstName} ${ah.user.lastName}`,
          department: ah.user.department,
          overtimeHours: 0,
          overtimeCost: 0,
          occurrences: 0,
        });
      }
      const emp = byEmployee.get(ah.userId);
      emp.overtimeHours += ah.overtimeHours;
      emp.overtimeCost += ah.overtimeHours * 200 * 1.4;
      emp.occurrences++;
    }

    const topOvertimeEmployees = Array.from(byEmployee.values())
      .sort((a, b) => b.overtimeHours - a.overtimeHours)
      .slice(0, 10)
      .map((emp) => ({
        ...emp,
        overtimeHours: Math.round(emp.overtimeHours * 100) / 100,
        overtimeCost: Math.round(emp.overtimeCost * 100) / 100,
      }));

    const data = {
      organizationId: request.organizationId,
      period: { start: request.startDate, end: request.endDate },
      overview: {
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        overtimeCost: Math.round(overtimeCost * 100) / 100,
        employeesWithOvertime,
        avgOvertimePerEmployee: employeesWithOvertime > 0
          ? Math.round((totalOvertimeHours / employeesWithOvertime) * 10) / 10
          : 0,
      },
      topOvertimeEmployees,
      byEmployee: Array.from(byEmployee.values()).map((emp) => ({
        ...emp,
        overtimeHours: Math.round(emp.overtimeHours * 100) / 100,
        overtimeCost: Math.round(emp.overtimeCost * 100) / 100,
      })),
    };

    const summary: ReportSummary = {
      totalRecords: employeesWithOvertime,
      keyMetrics: {
        totalOvertimeHours: `${Math.round(totalOvertimeHours)} hours`,
        overtimeCost: `${Math.round(overtimeCost)} NOK`,
        employeesWithOvertime,
      },
      highlights: [
        `${Math.round(totalOvertimeHours)} total overtime hours`,
        `Overtime cost: ${Math.round(overtimeCost)} NOK`,
        `${employeesWithOvertime} employees worked overtime`,
      ],
      warnings:
        totalOvertimeHours > 100
          ? ['High overtime hours detected - review scheduling efficiency']
          : undefined,
    };

    return { data, summary };
  }

  private async generateShiftCoverageReport(
    request: GenerateReportRequest
  ): Promise<{ data: any; summary: ReportSummary }> {
    const rosters = await this.getRostersInPeriod(
      request.organizationId,
      request.startDate,
      request.endDate,
      request.filters
    );

    const shifts = rosters.flatMap((r) => r.shifts);
    const totalShifts = shifts.length;
    const filledShifts = shifts.filter((s) => s.userId).length;
    const unfilledShifts = totalShifts - filledShifts;
    const coverageRate = totalShifts > 0 ? (filledShifts / totalShifts) * 100 : 100;

    // Group by department
    const byDepartment = new Map<string, any>();
    for (const shift of shifts) {
      const dept = shift.department || 'Unassigned';
      if (!byDepartment.has(dept)) {
        byDepartment.set(dept, {
          department: dept,
          totalShifts: 0,
          filledShifts: 0,
          unfilledShifts: 0,
          coverageRate: 0,
        });
      }
      const deptData = byDepartment.get(dept);
      deptData.totalShifts++;
      if (shift.userId) {
        deptData.filledShifts++;
      } else {
        deptData.unfilledShifts++;
      }
    }

    // Calculate coverage rates
    for (const [_, dept] of byDepartment) {
      dept.coverageRate = dept.totalShifts > 0
        ? Math.round((dept.filledShifts / dept.totalShifts) * 1000) / 10
        : 100;
    }

    const data = {
      organizationId: request.organizationId,
      period: { start: request.startDate, end: request.endDate },
      overview: {
        totalShifts,
        filledShifts,
        unfilledShifts,
        coverageRate: Math.round(coverageRate * 10) / 10,
      },
      byDepartment: Array.from(byDepartment.values()),
      gapAnalysis: {
        daysWithUnfilledShifts: 0, // TODO: Calculate
        peakUnfilledDays: [], // TODO: Calculate
      },
    };

    const summary: ReportSummary = {
      totalRecords: totalShifts,
      keyMetrics: {
        coverageRate: `${Math.round(coverageRate)}%`,
        filledShifts,
        unfilledShifts,
      },
      highlights: [
        `${filledShifts} out of ${totalShifts} shifts filled`,
        `Coverage rate: ${Math.round(coverageRate)}%`,
      ],
      warnings: unfilledShifts > 0 ? [`${unfilledShifts} shifts remain unfilled`] : undefined,
    };

    return { data, summary };
  }

  private async generateArbeidstilsynetExport(
    request: GenerateReportRequest
  ): Promise<{ data: any; summary: ReportSummary }> {
    const report = await this.complianceReportGenerator.generateArbeidstilsynetReport(
      request.organizationId,
      request.startDate,
      request.endDate
    );

    const summary: ReportSummary = {
      totalRecords: report.employees.length,
      keyMetrics: {
        totalEmployees: report.summary.totalEmployees,
        totalPlannedHours: report.summary.totalPlannedHours,
        totalViolations: report.summary.totalViolations,
        latePublications: report.summary.latePublications,
      },
      highlights: [
        `${report.summary.totalEmployees} employees included`,
        `${report.summary.totalPlannedHours} total planned hours`,
        report.summary.totalViolations > 0
          ? `⚠️ ${report.summary.totalViolations} compliance violations`
          : '✓ No compliance violations',
      ],
      warnings:
        report.summary.latePublications > 0
          ? [`${report.summary.latePublications} late publication(s) - may require explanation to Arbeidstilsynet`]
          : undefined,
    };

    return { data: report, summary };
  }

  private async generateEmployeeHoursSummary(
    request: GenerateReportRequest
  ): Promise<{ data: any; summary: ReportSummary }> {
    const actualHoursData = await prisma.actualHours.findMany({
      where: {
        date: { gte: request.startDate, lte: request.endDate },
        ...(request.filters?.userIds && { userId: { in: request.filters.userIds } }),
      },
      include: { user: true },
    });

    // Group by employee
    const byEmployee = new Map<string, any>();
    for (const ah of actualHoursData) {
      if (!byEmployee.has(ah.userId)) {
        byEmployee.set(ah.userId, {
          userId: ah.userId,
          employeeNumber: ah.user.employeeNumber,
          employeeName: `${ah.user.firstName} ${ah.user.lastName}`,
          department: ah.user.department,
          regularHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          shifts: 0,
        });
      }
      const emp = byEmployee.get(ah.userId);
      emp.regularHours += ah.totalHours - ah.overtimeHours;
      emp.overtimeHours += ah.overtimeHours;
      emp.totalHours += ah.totalHours;
      emp.shifts++;
    }

    const employees = Array.from(byEmployee.values()).map((emp) => ({
      ...emp,
      regularHours: Math.round(emp.regularHours * 100) / 100,
      overtimeHours: Math.round(emp.overtimeHours * 100) / 100,
      totalHours: Math.round(emp.totalHours * 100) / 100,
    }));

    const totalRegularHours = employees.reduce((sum, e) => sum + e.regularHours, 0);
    const totalOvertimeHours = employees.reduce((sum, e) => sum + e.overtimeHours, 0);
    const totalHours = employees.reduce((sum, e) => sum + e.totalHours, 0);

    const data = {
      organizationId: request.organizationId,
      period: { start: request.startDate, end: request.endDate },
      summary: {
        totalEmployees: employees.length,
        totalRegularHours: Math.round(totalRegularHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
      },
      employees,
    };

    const summary: ReportSummary = {
      totalRecords: employees.length,
      keyMetrics: {
        totalEmployees: employees.length,
        totalHours: `${Math.round(totalHours)} hours`,
        totalOvertimeHours: `${Math.round(totalOvertimeHours)} hours`,
      },
      highlights: [
        `${employees.length} employees tracked`,
        `${Math.round(totalHours)} total hours worked`,
        `${Math.round(totalOvertimeHours)} overtime hours`,
      ],
    };

    return { data, summary };
  }

  // ===== Helper Methods =====

  private async getRostersInPeriod(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    filters?: ReportFilter
  ) {
    return await prisma.roster.findMany({
      where: {
        organizationId,
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        ...(filters?.includeArchived !== true && { status: { not: 'ARCHIVED' } }),
      },
      include: {
        shifts: {
          where: {
            ...(filters?.userIds && { userId: { in: filters.userIds } }),
            ...(filters?.departmentIds && { department: { in: filters.departmentIds } }),
          },
        },
      },
    });
  }

  private convertToCSV(report: GeneratedReport): string {
    // Generic CSV conversion - can be customized per report type
    const rows: string[][] = [];

    // Add header
    rows.push([
      `Report: ${report.templateName}`,
      `Period: ${format(report.startDate, 'yyyy-MM-dd')} to ${format(report.endDate, 'yyyy-MM-dd')}`,
      `Generated: ${format(report.generatedAt, 'yyyy-MM-dd HH:mm')}`,
    ]);
    rows.push([]); // Empty row

    // Add summary
    rows.push(['Summary']);
    for (const [key, value] of Object.entries(report.summary.keyMetrics)) {
      rows.push([key, String(value)]);
    }
    rows.push([]); // Empty row

    // Add data (simplified - would need customization per report type)
    rows.push(['Data']);
    rows.push([JSON.stringify(report.data)]);

    return rows.map((row) => row.join(',')).join('\n');
  }

  private calculateNextRun(schedule: ScheduledReport['schedule']): Date {
    const now = new Date();
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
    }
  }
}
