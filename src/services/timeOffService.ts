// Time-Off Request Service
// Manages vacation, sick leave, and other time-off requests with accrual tracking

import { PrismaClient } from '@prisma/client';
import { differenceInDays } from 'date-fns';
import { AuditLogger } from './auditLogger';

const prisma = new PrismaClient();

export class TimeOffService {
  private auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = new AuditLogger();
  }

  /**
   * Submit time-off request
   */
  async submitTimeOffRequest(data: {
    userId: string;
    type: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
    attachment?: string;
  }) {
    // Calculate total days
    const totalDays = this.calculateWorkingDays(data.startDate, data.endDate);

    // Check accrual balance if applicable
    if (data.type === 'VACATION') {
      const hasBalance = await this.checkAccrualBalance(
        data.userId,
        'VACATION',
        totalDays
      );

      if (!hasBalance) {
        throw new Error('Insufficient vacation balance');
      }
    }

    // Create request
    const request = await prisma.timeOffRequest.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays,
        reason: data.reason,
        attachment: data.attachment,
        status: 'PENDING',
      },
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'TIME_OFF_REQUESTED',
      entityType: 'TimeOffRequest',
      entityId: request.id,
      userId: data.userId,
      details: {
        type: data.type,
        totalDays,
      },
    });

    // TODO: Notify manager
    // await notificationService.notifyTimeOffRequest(request);

    return request;
  }

  /**
   * Approve time-off request
   */
  async approveTimeOffRequest(
    requestId: string,
    approvedBy: string,
    approvedByEmail: string
  ) {
    const request = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Request has already been processed');
    }

    // Approve request
    const approved = await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Deduct from accrual balance
    if (request.type === 'VACATION' || request.type === 'SICK_LEAVE') {
      await this.deductFromAccrual(
        request.userId,
        request.type as any,
        request.totalDays
      );

      // Update request with deduction info
      await prisma.timeOffRequest.update({
        where: { id: requestId },
        data: {
          deductedFrom: request.type as any,
          deductedDays: request.totalDays,
        },
      });
    }

    // Log to audit
    await this.auditLogger.log({
      action: 'TIME_OFF_APPROVED',
      entityType: 'TimeOffRequest',
      entityId: requestId,
      userId: approvedBy,
      userEmail: approvedByEmail,
      details: {
        employeeId: request.userId,
        totalDays: request.totalDays,
      },
    });

    // TODO: Notify employee
    // await notificationService.notifyTimeOffApproved(approved);

    return approved;
  }

  /**
   * Reject time-off request
   */
  async rejectTimeOffRequest(
    requestId: string,
    rejectedBy: string,
    rejectedByEmail: string,
    rejectionReason: string
  ) {
    const request = await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: rejectedBy, // Reusing field for who processed it
        approvedAt: new Date(),
        rejectionReason,
      },
    });

    await this.auditLogger.log({
      action: 'TIME_OFF_REJECTED',
      entityType: 'TimeOffRequest',
      entityId: requestId,
      userId: rejectedBy,
      userEmail: rejectedByEmail,
      details: {
        employeeId: request.userId,
        reason: rejectionReason,
      },
    });

    return request;
  }

  /**
   * Get accrual balance for user
   */
  async getAccrualBalance(userId: string, type: string, year: number) {
    let balance = await prisma.accrualBalance.findUnique({
      where: {
        userId_type_year: {
          userId,
          type: type as any,
          year,
        },
      },
    });

    // Create if doesn't exist
    if (!balance) {
      const annualEntitlement = type === 'VACATION' ? 25 : 10; // Norwegian standard

      balance = await prisma.accrualBalance.create({
        data: {
          userId,
          type: type as any,
          year,
          annualEntitlement,
          earnedDays: annualEntitlement,
          usedDays: 0,
          remainingDays: annualEntitlement,
        },
      });
    }

    return balance;
  }

  /**
   * Check if user has sufficient accrual balance
   */
  private async checkAccrualBalance(
    userId: string,
    type: string,
    daysNeeded: number
  ): Promise<boolean> {
    const currentYear = new Date().getFullYear();
    const balance = await this.getAccrualBalance(userId, type, currentYear);

    return balance.remainingDays >= daysNeeded;
  }

  /**
   * Deduct days from accrual balance
   */
  private async deductFromAccrual(
    userId: string,
    type: string,
    days: number
  ) {
    const currentYear = new Date().getFullYear();
    const balance = await this.getAccrualBalance(userId, type, currentYear);

    const newUsedDays = balance.usedDays + days;
    const newRemainingDays = balance.earnedDays - newUsedDays;

    await prisma.accrualBalance.update({
      where: { id: balance.id },
      data: {
        usedDays: newUsedDays,
        remainingDays: newRemainingDays,
      },
    });
  }

  /**
   * Calculate working days between dates (excluding weekends)
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let days = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Exclude Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  /**
   * Get all time-off requests for user
   */
  async getUserTimeOffRequests(userId: string) {
    return await prisma.timeOffRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get pending time-off requests (for managers)
   */
  async getPendingTimeOffRequests() {
    return await prisma.timeOffRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get all accrual balances for user
   */
  async getUserAccrualBalances(userId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    return await prisma.accrualBalance.findMany({
      where: {
        userId,
        year: targetYear,
      },
    });
  }
}
