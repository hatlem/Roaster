// Audit Logging Service
// Maintains comprehensive audit trail for Arbeidstilsynet compliance
// All roster-related actions must be logged for at least 2 years

import { PrismaClient } from '@prisma/client';
import { addYears } from 'date-fns';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  userEmail?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  rosterId?: string;
}

export class AuditLogger {
  private retentionYears: number;

  constructor(retentionYears: number = 2) {
    this.retentionYears = retentionYears;
  }

  /**
   * Log an action to the audit trail
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const retainUntil = addYears(new Date(), this.retentionYears);

      await prisma.auditLog.create({
        data: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          userId: entry.userId,
          userEmail: entry.userEmail,
          details: entry.details || {},
          ipAddress: entry.ipAddress,
          rosterId: entry.rosterId,
          retainUntil,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - logging failure shouldn't break the application
    }
  }

  /**
   * Log roster creation
   */
  async logRosterCreated(
    rosterId: string,
    userId: string,
    userEmail: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      action: 'ROSTER_CREATED',
      entityType: 'Roster',
      entityId: rosterId,
      userId,
      userEmail,
      details,
      rosterId,
    });
  }

  /**
   * Log roster publication
   */
  async logRosterPublished(
    rosterId: string,
    userId: string,
    userEmail: string,
    isLate: boolean,
    daysUntilStart: number
  ): Promise<void> {
    await this.log({
      action: 'ROSTER_PUBLISHED',
      entityType: 'Roster',
      entityId: rosterId,
      userId,
      userEmail,
      details: {
        isLate,
        daysUntilStart,
        complianceStatus: isLate ? 'VIOLATION' : 'COMPLIANT',
      },
      rosterId,
    });
  }

  /**
   * Log shift creation
   */
  async logShiftCreated(
    shiftId: string,
    rosterId: string,
    userId: string,
    userEmail: string,
    assignedToUserId: string,
    violations: string[]
  ): Promise<void> {
    await this.log({
      action: 'SHIFT_CREATED',
      entityType: 'Shift',
      entityId: shiftId,
      userId,
      userEmail,
      details: {
        assignedToUserId,
        violations,
        hasViolations: violations.length > 0,
      },
      rosterId,
    });
  }

  /**
   * Log shift modification
   */
  async logShiftModified(
    shiftId: string,
    rosterId: string,
    userId: string,
    userEmail: string,
    changes: Record<string, unknown>,
    reason?: string
  ): Promise<void> {
    await this.log({
      action: 'SHIFT_MODIFIED',
      entityType: 'Shift',
      entityId: shiftId,
      userId,
      userEmail,
      details: {
        changes,
        reason,
        timestamp: new Date().toISOString(),
      },
      rosterId,
    });
  }

  /**
   * Log shift deletion
   */
  async logShiftDeleted(
    shiftId: string,
    rosterId: string,
    userId: string,
    userEmail: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      action: 'SHIFT_DELETED',
      entityType: 'Shift',
      entityId: shiftId,
      userId,
      userEmail,
      details: {
        reason,
      },
      rosterId,
    });
  }

  /**
   * Log user access to roster
   */
  async logRosterAccess(
    rosterId: string,
    userId: string,
    userEmail: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: 'ROSTER_ACCESSED',
      entityType: 'Roster',
      entityId: rosterId,
      userId,
      userEmail,
      ipAddress,
      rosterId,
    });
  }

  /**
   * Log compliance report generation (for Arbeidstilsynet)
   */
  async logComplianceReportGenerated(
    reportId: string,
    userId: string,
    userEmail: string,
    reportType: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    await this.log({
      action: 'COMPLIANCE_REPORT_GENERATED',
      entityType: 'ComplianceReport',
      entityId: reportId,
      userId,
      userEmail,
      details: {
        reportType,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
    });
  }

  /**
   * Get audit logs for a specific roster
   */
  async getRosterAuditLogs(rosterId: string) {
    return await prisma.auditLog.findMany({
      where: { rosterId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, startDate: Date, endDate: Date) {
    return await prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Clean up expired audit logs (past retention period)
   */
  async cleanupExpiredLogs(): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        retainUntil: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
