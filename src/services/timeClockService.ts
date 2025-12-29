// Time Clock Service
// Handles employee time tracking with Norwegian labor law compliance
// Tracks clock in/out, breaks, overtime, and compliance violations

import { PrismaClient } from '@prisma/client';
import { differenceInMinutes, differenceInHours, startOfDay, endOfDay, format } from 'date-fns';
import { AuditLogger } from './auditLogger';

const prisma = new PrismaClient();

export interface ClockInData {
  userId: string;
  clockInTime: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
  kioskMode?: boolean;
  kioskDeviceId?: string;
}

export interface ClockOutData {
  userId: string;
  clockOutTime: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
}

export interface BreakData {
  userId: string;
  breakTime: Date;
  breakType: 'START' | 'END';
}

export interface ManualEntryData {
  userId: string;
  date: Date;
  clockIn: Date;
  clockOut: Date;
  breakMinutes: number;
  notes?: string;
  createdBy: string;
  createdByEmail: string;
}

export interface TimeClockStatus {
  isClockedIn: boolean;
  isOnBreak: boolean;
  currentEntry?: any;
  currentBreak?: any;
  hoursWorkedToday: number;
  scheduledShift?: any;
  isLate: boolean;
  isEarlyDeparture: boolean;
  complianceIssues: string[];
}

export interface ComplianceIssue {
  type: 'NO_BREAK' | 'INSUFFICIENT_BREAK' | 'EXCESSIVE_HOURS' | 'LATE_ARRIVAL' | 'EARLY_DEPARTURE';
  severity: 'WARNING' | 'VIOLATION';
  message: string;
  details?: Record<string, unknown>;
}

export class TimeClockService {
  private auditLogger: AuditLogger;
  private readonly MAX_DAILY_HOURS = 9; // Norwegian law: 9 hours normal work day
  private readonly BREAK_REQUIRED_AFTER_HOURS = 5.5; // 30 min break required after 5.5 hours
  private readonly MIN_BREAK_MINUTES = 30;

  constructor() {
    this.auditLogger = new AuditLogger();
  }

  /**
   * Clock in an employee
   */
  async clockIn(data: ClockInData) {
    // Check if already clocked in
    const existing = await this.getActiveEntry(data.userId);
    if (existing) {
      throw new Error('Already clocked in. Please clock out first.');
    }

    // Get today's scheduled shift (if any)
    const scheduledShift = await this.getScheduledShift(data.userId, data.clockInTime);

    // Check if late
    let isLate = false;
    let minutesLate = 0;
    if (scheduledShift) {
      const diff = differenceInMinutes(data.clockInTime, scheduledShift.startTime);
      if (diff > 5) { // Grace period of 5 minutes
        isLate = true;
        minutesLate = diff;
      }
    }

    // Create ActualHours entry (will be completed on clock out)
    const entry = await prisma.actualHours.create({
      data: {
        userId: data.userId,
        date: startOfDay(data.clockInTime),
        clockIn: data.clockInTime,
        clockOut: null as any, // Will be set on clock out
        breakMinutes: 0,
        totalHours: 0,
        isOvertime: false,
        overtimeHours: 0,
        notes: data.notes,
      },
    });

    // Store location and metadata in a separate tracking table if needed
    // For now, we'll log it in the audit trail
    await this.auditLogger.log({
      action: 'CLOCK_IN',
      entityType: 'ActualHours',
      entityId: entry.id,
      userId: data.userId,
      details: {
        clockInTime: data.clockInTime.toISOString(),
        location: data.location,
        scheduledShiftId: scheduledShift?.id,
        isLate,
        minutesLate,
        kioskMode: data.kioskMode,
        kioskDeviceId: data.kioskDeviceId,
      },
    });

    return {
      entry,
      scheduledShift,
      isLate,
      minutesLate,
    };
  }

  /**
   * Clock out an employee
   */
  async clockOut(data: ClockOutData) {
    // Get active entry
    const entry = await this.getActiveEntry(data.userId);
    if (!entry) {
      throw new Error('No active clock-in found. Please clock in first.');
    }

    // Calculate total time worked
    const totalMinutes = differenceInMinutes(data.clockOutTime, entry.clockIn);
    const totalHours = (totalMinutes - entry.breakMinutes) / 60;

    // Calculate overtime
    const isOvertime = totalHours > this.MAX_DAILY_HOURS;
    const overtimeHours = isOvertime ? totalHours - this.MAX_DAILY_HOURS : 0;

    // Check if clocking out early from scheduled shift
    const scheduledShift = await this.getScheduledShift(data.userId, data.clockOutTime);
    let isEarlyDeparture = false;
    let minutesEarly = 0;
    if (scheduledShift && scheduledShift.endTime) {
      const diff = differenceInMinutes(scheduledShift.endTime, data.clockOutTime);
      if (diff > 5) { // Grace period of 5 minutes
        isEarlyDeparture = true;
        minutesEarly = diff;
      }
    }

    // Check for compliance issues
    const complianceIssues = this.checkComplianceIssues(
      entry.clockIn,
      data.clockOutTime,
      entry.breakMinutes,
      totalHours
    );

    // Update entry
    const updatedEntry = await prisma.actualHours.update({
      where: { id: entry.id },
      data: {
        clockOut: data.clockOutTime,
        totalHours,
        isOvertime,
        overtimeHours,
        notes: data.notes || entry.notes,
      },
    });

    // Log clock out
    await this.auditLogger.log({
      action: 'CLOCK_OUT',
      entityType: 'ActualHours',
      entityId: entry.id,
      userId: data.userId,
      details: {
        clockOutTime: data.clockOutTime.toISOString(),
        totalHours,
        isOvertime,
        overtimeHours,
        location: data.location,
        scheduledShiftId: scheduledShift?.id,
        isEarlyDeparture,
        minutesEarly,
        complianceIssues: complianceIssues.map((i) => i.type),
      },
    });

    return {
      entry: updatedEntry,
      totalHours,
      isOvertime,
      overtimeHours,
      isEarlyDeparture,
      minutesEarly,
      complianceIssues,
    };
  }

  /**
   * Start a break
   */
  async startBreak(data: BreakData) {
    // Check if clocked in
    const entry = await this.getActiveEntry(data.userId);
    if (!entry) {
      throw new Error('Must be clocked in to start a break');
    }

    // Check if already on break (we could store this in a separate Break table)
    // For now, we'll use the audit log to track break status
    const recentBreaks = await prisma.auditLog.findMany({
      where: {
        userId: data.userId,
        action: { in: ['BREAK_START', 'BREAK_END'] },
        timestamp: {
          gte: entry.clockIn,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });

    if (recentBreaks.length > 0 && recentBreaks[0].action === 'BREAK_START') {
      throw new Error('Already on break. Please end current break first.');
    }

    // Log break start
    await this.auditLogger.log({
      action: 'BREAK_START',
      entityType: 'ActualHours',
      entityId: entry.id,
      userId: data.userId,
      details: {
        breakStartTime: data.breakTime.toISOString(),
      },
    });

    return {
      message: 'Break started',
      breakStartTime: data.breakTime,
      entryId: entry.id,
    };
  }

  /**
   * End a break
   */
  async endBreak(data: BreakData) {
    // Check if clocked in
    const entry = await this.getActiveEntry(data.userId);
    if (!entry) {
      throw new Error('Must be clocked in to end a break');
    }

    // Find the most recent break start
    const breakStart = await prisma.auditLog.findFirst({
      where: {
        userId: data.userId,
        action: 'BREAK_START',
        timestamp: {
          gte: entry.clockIn,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!breakStart) {
      throw new Error('No active break found');
    }

    // Calculate break duration
    const breakDuration = differenceInMinutes(
      data.breakTime,
      new Date(breakStart.timestamp)
    );

    // Update entry with accumulated break time
    const updatedEntry = await prisma.actualHours.update({
      where: { id: entry.id },
      data: {
        breakMinutes: entry.breakMinutes + breakDuration,
      },
    });

    // Log break end
    await this.auditLogger.log({
      action: 'BREAK_END',
      entityType: 'ActualHours',
      entityId: entry.id,
      userId: data.userId,
      details: {
        breakEndTime: data.breakTime.toISOString(),
        breakDuration,
        totalBreakMinutes: updatedEntry.breakMinutes,
      },
    });

    return {
      message: 'Break ended',
      breakEndTime: data.breakTime,
      breakDuration,
      totalBreakMinutes: updatedEntry.breakMinutes,
    };
  }

  /**
   * Create manual time entry (manager only)
   */
  async createManualEntry(data: ManualEntryData) {
    // Validate dates
    if (data.clockOut <= data.clockIn) {
      throw new Error('Clock out time must be after clock in time');
    }

    // Check if entry already exists for this date
    const existing = await prisma.actualHours.findFirst({
      where: {
        userId: data.userId,
        date: startOfDay(data.date),
      },
    });

    if (existing) {
      throw new Error('Time entry already exists for this date');
    }

    // Calculate total hours
    const totalMinutes = differenceInMinutes(data.clockOut, data.clockIn);
    const totalHours = (totalMinutes - data.breakMinutes) / 60;

    // Calculate overtime
    const isOvertime = totalHours > this.MAX_DAILY_HOURS;
    const overtimeHours = isOvertime ? totalHours - this.MAX_DAILY_HOURS : 0;

    // Create entry
    const entry = await prisma.actualHours.create({
      data: {
        userId: data.userId,
        date: startOfDay(data.date),
        clockIn: data.clockIn,
        clockOut: data.clockOut,
        breakMinutes: data.breakMinutes,
        totalHours,
        isOvertime,
        overtimeHours,
        notes: data.notes,
        approvedBy: data.createdBy, // Manager who created it
        approvedAt: new Date(),
      },
    });

    // Log manual entry creation
    await this.auditLogger.log({
      action: 'MANUAL_TIME_ENTRY_CREATED',
      entityType: 'ActualHours',
      entityId: entry.id,
      userId: data.createdBy,
      userEmail: data.createdByEmail,
      details: {
        employeeId: data.userId,
        date: data.date.toISOString(),
        clockIn: data.clockIn.toISOString(),
        clockOut: data.clockOut.toISOString(),
        totalHours,
        isOvertime,
        overtimeHours,
      },
    });

    return entry;
  }

  /**
   * Get current clock status for user
   */
  async getStatus(userId: string): Promise<TimeClockStatus> {
    const activeEntry = await this.getActiveEntry(userId);
    const scheduledShift = await this.getScheduledShift(userId, new Date());

    // Check if on break
    let isOnBreak = false;
    let currentBreak = null;
    if (activeEntry) {
      const recentBreaks = await prisma.auditLog.findMany({
        where: {
          userId,
          action: { in: ['BREAK_START', 'BREAK_END'] },
          timestamp: {
            gte: activeEntry.clockIn,
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });

      if (recentBreaks.length > 0 && recentBreaks[0].action === 'BREAK_START') {
        isOnBreak = true;
        currentBreak = recentBreaks[0];
      }
    }

    // Calculate hours worked today
    const hoursWorkedToday = await this.getHoursWorkedToday(userId);

    // Check for compliance issues
    let complianceIssues: string[] = [];
    let isLate = false;
    let isEarlyDeparture = false;

    if (activeEntry && scheduledShift) {
      const diff = differenceInMinutes(activeEntry.clockIn, scheduledShift.startTime);
      if (diff > 5) {
        isLate = true;
        complianceIssues.push(`Clocked in ${diff} minutes late`);
      }
    }

    if (activeEntry) {
      const issues = this.checkComplianceIssues(
        activeEntry.clockIn,
        new Date(),
        activeEntry.breakMinutes,
        hoursWorkedToday
      );
      complianceIssues.push(...issues.map((i) => i.message));
    }

    return {
      isClockedIn: !!activeEntry,
      isOnBreak,
      currentEntry: activeEntry,
      currentBreak,
      hoursWorkedToday,
      scheduledShift,
      isLate,
      isEarlyDeparture,
      complianceIssues,
    };
  }

  /**
   * Get time entries for a date range
   */
  async getHistory(userId: string, startDate: Date, endDate: Date) {
    const entries = await prisma.actualHours.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      orderBy: { date: 'desc' },
    });

    return entries;
  }

  /**
   * Get today's time entries for all employees (manager view)
   */
  async getTodayEntries(includeUsers: boolean = true) {
    const today = startOfDay(new Date());

    const entries = await prisma.actualHours.findMany({
      where: {
        date: today,
      },
      include: includeUsers ? {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      } : undefined,
      orderBy: { clockIn: 'desc' },
    });

    // Add status for each entry
    const entriesWithStatus = await Promise.all(
      entries.map(async (entry) => {
        const status = await this.getStatus(entry.userId);
        return {
          ...entry,
          status,
        };
      })
    );

    return entriesWithStatus;
  }

  /**
   * Get active (uncompleted) entry for user
   */
  private async getActiveEntry(userId: string) {
    return await prisma.actualHours.findFirst({
      where: {
        userId,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });
  }

  /**
   * Get scheduled shift for user at given time
   */
  private async getScheduledShift(userId: string, time: Date) {
    return await prisma.shift.findFirst({
      where: {
        userId,
        startTime: {
          lte: time,
        },
        endTime: {
          gte: time,
        },
        roster: {
          status: { in: ['PUBLISHED', 'ACTIVE'] },
        },
      },
      include: {
        roster: true,
      },
    });
  }

  /**
   * Get total hours worked today
   */
  private async getHoursWorkedToday(userId: string): Promise<number> {
    const today = startOfDay(new Date());

    const entries = await prisma.actualHours.findMany({
      where: {
        userId,
        date: today,
      },
    });

    // For active entry, calculate current duration
    const activeEntry = entries.find((e) => !e.clockOut);
    let currentHours = 0;
    if (activeEntry) {
      const currentMinutes = differenceInMinutes(new Date(), activeEntry.clockIn);
      currentHours = (currentMinutes - activeEntry.breakMinutes) / 60;
    }

    // Sum completed entries
    const completedHours = entries
      .filter((e) => e.clockOut)
      .reduce((sum, e) => sum + e.totalHours, 0);

    return completedHours + currentHours;
  }

  /**
   * Check for compliance issues
   */
  private checkComplianceIssues(
    clockIn: Date,
    clockOut: Date,
    breakMinutes: number,
    totalHours: number
  ): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Check if working more than 5.5 hours without adequate break
    if (totalHours > this.BREAK_REQUIRED_AFTER_HOURS && breakMinutes < this.MIN_BREAK_MINUTES) {
      issues.push({
        type: 'INSUFFICIENT_BREAK',
        severity: 'VIOLATION',
        message: `Norwegian law requires at least ${this.MIN_BREAK_MINUTES} minutes break after ${this.BREAK_REQUIRED_AFTER_HOURS} hours of work. Current break: ${breakMinutes} minutes.`,
        details: {
          requiredBreak: this.MIN_BREAK_MINUTES,
          actualBreak: breakMinutes,
          hoursWorked: totalHours,
        },
      });
    }

    // Check if exceeding daily hours limit
    if (totalHours > this.MAX_DAILY_HOURS) {
      issues.push({
        type: 'EXCESSIVE_HOURS',
        severity: 'WARNING',
        message: `Working hours exceed normal daily limit of ${this.MAX_DAILY_HOURS} hours. Current: ${totalHours.toFixed(1)} hours. This is considered overtime.`,
        details: {
          maxDailyHours: this.MAX_DAILY_HOURS,
          actualHours: totalHours,
          overtimeHours: totalHours - this.MAX_DAILY_HOURS,
        },
      });
    }

    // Check if working more than 12 hours (absolute maximum with overtime)
    if (totalHours > 12) {
      issues.push({
        type: 'EXCESSIVE_HOURS',
        severity: 'VIOLATION',
        message: `Working hours exceed maximum daily limit of 12 hours (including overtime). Current: ${totalHours.toFixed(1)} hours.`,
        details: {
          maxAbsoluteHours: 12,
          actualHours: totalHours,
        },
      });
    }

    return issues;
  }

  /**
   * Get overtime summary for user in a period
   */
  async getOvertimeSummary(userId: string, startDate: Date, endDate: Date) {
    const entries = await this.getHistory(userId, startDate, endDate);

    const totalOvertimeHours = entries.reduce((sum, e) => sum + e.overtimeHours, 0);
    const totalRegularHours = entries.reduce(
      (sum, e) => sum + (e.totalHours - e.overtimeHours),
      0
    );
    const totalHours = entries.reduce((sum, e) => sum + e.totalHours, 0);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totalDays: entries.length,
      totalHours,
      totalRegularHours,
      totalOvertimeHours,
      averageHoursPerDay: entries.length > 0 ? totalHours / entries.length : 0,
      entries,
    };
  }
}
