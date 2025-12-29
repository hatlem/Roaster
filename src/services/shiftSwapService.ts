// Shift Swap Service
// Handles peer-to-peer shift swapping between employees
// Validates compliance before approval

import { PrismaClient } from '@prisma/client';
import { AuditLogger } from './auditLogger';
import { RestPeriodValidator } from './restPeriodValidator';
import { WorkingHoursValidator } from './workingHoursValidator';
import { NotificationService } from './notificationService';
import { ShiftData, ComplianceConfig } from '../types';

const prisma = new PrismaClient();

export class ShiftSwapService {
  private auditLogger: AuditLogger;
  private restValidator: RestPeriodValidator;
  private hoursValidator: WorkingHoursValidator;
  private notificationService: NotificationService;
  private complianceConfig: ComplianceConfig;

  constructor(config?: ComplianceConfig) {
    this.auditLogger = new AuditLogger();
    this.notificationService = new NotificationService();

    // Default Norwegian compliance config
    this.complianceConfig = config || {
      maxDailyHours: 9,
      maxWeeklyHours: 40,
      minDailyRest: 11,
      minWeeklyRest: 35,
      publishDeadlineDays: 14,
      maxOvertimePerWeek: 10,
      maxOvertimePer4Weeks: 25,
      maxOvertimePerYear: 200,
    };

    this.restValidator = new RestPeriodValidator(this.complianceConfig);
    this.hoursValidator = new WorkingHoursValidator(this.complianceConfig);
  }

  /**
   * Request a shift swap
   * Can be targeted at specific employee or open to all
   */
  async requestSwap(data: {
    requestedBy: string;
    requestedByEmail: string;
    requestedShiftId: string;
    targetEmployee?: string;
    offeredShiftId?: string;
    reason: string;
  }) {
    // Validate requested shift exists and belongs to requester
    const requestedShift = await prisma.shift.findUnique({
      where: { id: data.requestedShiftId },
      include: { roster: true, user: true },
    });

    if (!requestedShift) {
      throw new Error('Requested shift not found');
    }

    if (requestedShift.userId !== data.requestedBy) {
      throw new Error('You can only swap your own shifts');
    }

    // Check if shift hasn't already started
    if (requestedShift.startTime < new Date()) {
      throw new Error('Cannot swap shifts that have already started');
    }

    // Check if shift is in a published roster
    if (requestedShift.roster.status !== 'PUBLISHED' && requestedShift.roster.status !== 'ACTIVE') {
      throw new Error('Can only swap shifts in published rosters');
    }

    // If target employee specified, validate offered shift
    if (data.targetEmployee && data.offeredShiftId) {
      const offeredShift = await prisma.shift.findUnique({
        where: { id: data.offeredShiftId },
        include: { roster: true },
      });

      if (!offeredShift) {
        throw new Error('Offered shift not found');
      }

      if (offeredShift.userId !== data.targetEmployee) {
        throw new Error('Offered shift does not belong to target employee');
      }

      if (offeredShift.startTime < new Date()) {
        throw new Error('Cannot swap with shifts that have already started');
      }

      if (offeredShift.roster.status !== 'PUBLISHED' && offeredShift.roster.status !== 'ACTIVE') {
        throw new Error('Offered shift must be in a published roster');
      }
    } else if (data.targetEmployee && !data.offeredShiftId) {
      // Direct swap request without specific offered shift
      // Target employee can accept and give up their own shift later
    }

    // Check for existing pending swap request for this shift
    const existingRequest = await prisma.shiftSwapRequest.findFirst({
      where: {
        requestedShiftId: data.requestedShiftId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new Error('A pending swap request already exists for this shift');
    }

    // Create swap request
    const swapRequest = await prisma.shiftSwapRequest.create({
      data: {
        requestedBy: data.requestedBy,
        requestedShiftId: data.requestedShiftId,
        targetEmployee: data.targetEmployee,
        offeredShiftId: data.offeredShiftId,
        reason: data.reason,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        requestedShift: {
          include: {
            roster: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        offeredShift: true,
      },
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'SWAP_REQUEST_CREATED',
      entityType: 'ShiftSwapRequest',
      entityId: swapRequest.id,
      userId: data.requestedBy,
      userEmail: data.requestedByEmail,
      details: {
        requestedShiftId: data.requestedShiftId,
        targetEmployee: data.targetEmployee,
        offeredShiftId: data.offeredShiftId,
        reason: data.reason,
      },
    });

    // Notify target employee or relevant parties
    if (data.targetEmployee) {
      await prisma.notification.create({
        data: {
          userId: data.targetEmployee,
          type: 'SWAP_REQUEST_RECEIVED',
          title: 'New Shift Swap Request',
          message: `${swapRequest.requester.firstName} ${swapRequest.requester.lastName} wants to swap shifts with you. Reason: ${data.reason}`,
          relatedEntityType: 'ShiftSwapRequest',
          relatedEntityId: swapRequest.id,
        },
      });
    } else {
      // TODO: Notify eligible employees about open swap request
      // await notificationService.notifyOpenSwapRequest(swapRequest);
    }

    return swapRequest;
  }

  /**
   * Get swap requests created by user
   */
  async getMySwapRequests(userId: string) {
    return await prisma.shiftSwapRequest.findMany({
      where: {
        requestedBy: userId,
      },
      include: {
        requestedShift: {
          include: {
            roster: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        offeredShift: {
          include: {
            roster: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get swap requests targeting user
   */
  async getIncomingSwapRequests(userId: string) {
    return await prisma.shiftSwapRequest.findMany({
      where: {
        OR: [
          { targetEmployee: userId },
          { targetEmployee: null }, // Open swap requests
        ],
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        requestedShift: {
          include: {
            roster: true,
          },
        },
        offeredShift: {
          include: {
            roster: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Accept swap request (target employee)
   */
  async acceptSwap(data: {
    swapRequestId: string;
    userId: string;
    userEmail: string;
    offeredShiftId?: string;
  }) {
    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: data.swapRequestId },
      include: {
        requester: true,
        requestedShift: {
          include: {
            roster: true,
          },
        },
        targetUser: true,
        offeredShift: {
          include: {
            roster: true,
          },
        },
      },
    });

    if (!swapRequest) {
      throw new Error('Swap request not found');
    }

    if (swapRequest.status !== 'PENDING') {
      throw new Error('Swap request is not pending');
    }

    // Validate user is target employee (or it's an open swap)
    if (swapRequest.targetEmployee && swapRequest.targetEmployee !== data.userId) {
      throw new Error('You are not the target of this swap request');
    }

    // Check if shifts haven't started
    if (swapRequest.requestedShift.startTime < new Date()) {
      throw new Error('Cannot accept swap for shifts that have already started');
    }

    // If open swap, require offered shift
    if (!swapRequest.targetEmployee && !data.offeredShiftId && !swapRequest.offeredShiftId) {
      throw new Error('Must specify which shift you are offering in exchange');
    }

    // Validate offered shift if provided
    let offeredShiftId = swapRequest.offeredShiftId || data.offeredShiftId;
    if (data.offeredShiftId) {
      const offeredShift = await prisma.shift.findUnique({
        where: { id: data.offeredShiftId },
        include: { roster: true },
      });

      if (!offeredShift) {
        throw new Error('Offered shift not found');
      }

      if (offeredShift.userId !== data.userId) {
        throw new Error('You can only offer your own shifts');
      }

      if (offeredShift.startTime < new Date()) {
        throw new Error('Cannot offer shifts that have already started');
      }

      offeredShiftId = data.offeredShiftId;
    }

    // Validate compliance for both employees after swap
    const complianceValidation = await this.validateSwapCompliance(
      swapRequest.requestedShift.id,
      offeredShiftId!,
      swapRequest.requestedBy,
      data.userId
    );

    if (!complianceValidation.isValid) {
      throw new Error(
        `Swap would create compliance violations: ${complianceValidation.violations.join(', ')}`
      );
    }

    // Update swap request to awaiting manager approval
    const updated = await prisma.shiftSwapRequest.update({
      where: { id: data.swapRequestId },
      data: {
        status: 'PENDING', // Still pending, waiting for manager approval
        respondedBy: data.userId,
        respondedAt: new Date(),
        offeredShiftId: offeredShiftId,
      },
      include: {
        requester: true,
        requestedShift: {
          include: {
            roster: true,
          },
        },
        targetUser: true,
        offeredShift: {
          include: {
            roster: true,
          },
        },
      },
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'SWAP_REQUEST_ACCEPTED',
      entityType: 'ShiftSwapRequest',
      entityId: data.swapRequestId,
      userId: data.userId,
      userEmail: data.userEmail,
      details: {
        offeredShiftId,
        complianceCheck: complianceValidation,
      },
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: swapRequest.requestedBy,
        type: 'SWAP_REQUEST_ACCEPTED',
        title: 'Swap Request Accepted',
        message: `Your swap request has been accepted. Awaiting manager approval.`,
        relatedEntityType: 'ShiftSwapRequest',
        relatedEntityId: swapRequest.id,
      },
    });

    // TODO: Notify managers for approval
    // await notificationService.notifyManagerSwapPending(updated);

    return updated;
  }

  /**
   * Reject swap request
   */
  async rejectSwap(data: {
    swapRequestId: string;
    userId: string;
    userEmail: string;
    rejectionReason: string;
  }) {
    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: data.swapRequestId },
      include: {
        requester: true,
        requestedShift: true,
        targetUser: true,
      },
    });

    if (!swapRequest) {
      throw new Error('Swap request not found');
    }

    if (swapRequest.status !== 'PENDING') {
      throw new Error('Swap request is not pending');
    }

    // Validate user is target employee
    if (swapRequest.targetEmployee && swapRequest.targetEmployee !== data.userId) {
      throw new Error('You are not the target of this swap request');
    }

    // Update swap request
    const updated = await prisma.shiftSwapRequest.update({
      where: { id: data.swapRequestId },
      data: {
        status: 'REJECTED',
        respondedBy: data.userId,
        respondedAt: new Date(),
        rejectionReason: data.rejectionReason,
      },
      include: {
        requester: true,
        requestedShift: true,
        targetUser: true,
      },
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'SWAP_REQUEST_REJECTED',
      entityType: 'ShiftSwapRequest',
      entityId: data.swapRequestId,
      userId: data.userId,
      userEmail: data.userEmail,
      details: {
        rejectionReason: data.rejectionReason,
      },
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: swapRequest.requestedBy,
        type: 'SWAP_REQUEST_REJECTED',
        title: 'Swap Request Rejected',
        message: `Your swap request has been rejected. Reason: ${data.rejectionReason}`,
        relatedEntityType: 'ShiftSwapRequest',
        relatedEntityId: swapRequest.id,
      },
    });

    return updated;
  }

  /**
   * Approve swap request (manager action)
   */
  async approveSwap(data: {
    swapRequestId: string;
    managerId: string;
    managerEmail: string;
  }) {
    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: data.swapRequestId },
      include: {
        requester: true,
        requestedShift: {
          include: {
            roster: true,
          },
        },
        targetUser: true,
        offeredShift: {
          include: {
            roster: true,
          },
        },
      },
    });

    if (!swapRequest) {
      throw new Error('Swap request not found');
    }

    if (swapRequest.status !== 'PENDING') {
      throw new Error('Swap request is not pending');
    }

    if (!swapRequest.offeredShift) {
      throw new Error('No offered shift specified');
    }

    // Re-validate compliance before approval
    const complianceValidation = await this.validateSwapCompliance(
      swapRequest.requestedShift.id,
      swapRequest.offeredShift.id,
      swapRequest.requestedBy,
      swapRequest.offeredShift.userId
    );

    if (!complianceValidation.isValid) {
      throw new Error(
        `Cannot approve: swap would create compliance violations: ${complianceValidation.violations.join(', ')}`
      );
    }

    // Execute the swap in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update swap request
      const approved = await tx.shiftSwapRequest.update({
        where: { id: data.swapRequestId },
        data: {
          status: 'APPROVED',
          respondedBy: data.managerId,
          respondedAt: new Date(),
        },
      });

      // Swap the shifts
      const requestedShiftNewUserId = swapRequest.offeredShift!.userId;
      const offeredShiftNewUserId = swapRequest.requestedBy;

      await tx.shift.update({
        where: { id: swapRequest.requestedShift.id },
        data: {
          userId: requestedShiftNewUserId,
          isChanged: true,
          changeReason: 'EMPLOYEE_REQUEST',
          changeNotes: `Swapped via employee request: ${swapRequest.reason}`,
          changedBy: data.managerId,
          changedAt: new Date(),
          originalStartTime: swapRequest.requestedShift.startTime,
          originalEndTime: swapRequest.requestedShift.endTime,
        },
      });

      await tx.shift.update({
        where: { id: swapRequest.offeredShift!.id },
        data: {
          userId: offeredShiftNewUserId,
          isChanged: true,
          changeReason: 'EMPLOYEE_REQUEST',
          changeNotes: `Swapped via employee request: ${swapRequest.reason}`,
          changedBy: data.managerId,
          changedAt: new Date(),
          originalStartTime: swapRequest.offeredShift!.startTime,
          originalEndTime: swapRequest.offeredShift!.endTime,
        },
      });

      return approved;
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'SWAP_REQUEST_APPROVED',
      entityType: 'ShiftSwapRequest',
      entityId: data.swapRequestId,
      userId: data.managerId,
      userEmail: data.managerEmail,
      details: {
        requestedShiftId: swapRequest.requestedShift.id,
        offeredShiftId: swapRequest.offeredShift.id,
        requester: swapRequest.requestedBy,
        target: swapRequest.offeredShift.userId,
      },
    });

    // Notify both employees
    await prisma.notification.create({
      data: {
        userId: swapRequest.requestedBy,
        type: 'SWAP_REQUEST_APPROVED',
        title: 'Swap Request Approved',
        message: 'Your shift swap has been approved by management.',
        relatedEntityType: 'ShiftSwapRequest',
        relatedEntityId: swapRequest.id,
      },
    });

    if (swapRequest.targetUser) {
      await prisma.notification.create({
        data: {
          userId: swapRequest.targetUser.id,
          type: 'SWAP_REQUEST_APPROVED',
          title: 'Swap Request Approved',
          message: 'The shift swap has been approved by management.',
          relatedEntityType: 'ShiftSwapRequest',
          relatedEntityId: swapRequest.id,
        },
      });
    }

    return result;
  }

  /**
   * Cancel swap request (requester action)
   */
  async cancelSwap(data: {
    swapRequestId: string;
    userId: string;
    userEmail: string;
  }) {
    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: data.swapRequestId },
      include: {
        requester: true,
        targetUser: true,
      },
    });

    if (!swapRequest) {
      throw new Error('Swap request not found');
    }

    if (swapRequest.requestedBy !== data.userId) {
      throw new Error('You can only cancel your own swap requests');
    }

    if (swapRequest.status !== 'PENDING') {
      throw new Error('Can only cancel pending swap requests');
    }

    // Update swap request
    const cancelled = await prisma.shiftSwapRequest.update({
      where: { id: data.swapRequestId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        requester: true,
        targetUser: true,
      },
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'SWAP_REQUEST_CANCELLED',
      entityType: 'ShiftSwapRequest',
      entityId: data.swapRequestId,
      userId: data.userId,
      userEmail: data.userEmail,
    });

    // Notify target employee if applicable
    if (swapRequest.targetEmployee) {
      await prisma.notification.create({
        data: {
          userId: swapRequest.targetEmployee,
          type: 'SWAP_REQUEST_CANCELLED',
          title: 'Swap Request Cancelled',
          message: `${swapRequest.requester.firstName} ${swapRequest.requester.lastName} has cancelled their swap request.`,
          relatedEntityType: 'ShiftSwapRequest',
          relatedEntityId: swapRequest.id,
        },
      });
    }

    return cancelled;
  }

  /**
   * Validate that swapping shifts doesn't create compliance violations
   */
  private async validateSwapCompliance(
    requestedShiftId: string,
    offeredShiftId: string,
    requesterId: string,
    targetId: string
  ): Promise<{ isValid: boolean; violations: string[]; warnings: string[] }> {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Get both shifts with roster context
    const [requestedShift, offeredShift] = await Promise.all([
      prisma.shift.findUnique({
        where: { id: requestedShiftId },
        include: { roster: true },
      }),
      prisma.shift.findUnique({
        where: { id: offeredShiftId },
        include: { roster: true },
      }),
    ]);

    if (!requestedShift || !offeredShift) {
      violations.push('One or both shifts not found');
      return { isValid: false, violations, warnings };
    }

    // Get all shifts for both users in the relevant roster periods
    const [requesterShifts, targetShifts] = await Promise.all([
      prisma.shift.findMany({
        where: {
          userId: requesterId,
          rosterId: offeredShift.rosterId,
        },
      }),
      prisma.shift.findMany({
        where: {
          userId: targetId,
          rosterId: requestedShift.rosterId,
        },
      }),
    ]);

    // Convert to ShiftData format
    const convertToShiftData = (shift: any): ShiftData => ({
      id: shift.id,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      userId: shift.userId,
    });

    // Simulate the swap for requester
    const requesterShiftsAfterSwap = requesterShifts
      .filter((s) => s.id !== requestedShiftId)
      .map(convertToShiftData);
    const requesterNewShift = convertToShiftData({
      ...offeredShift,
      userId: requesterId,
    });

    // Validate requester compliance
    const requesterRestViolations = this.restValidator.validateAllRestPeriods(
      requesterNewShift,
      requesterShiftsAfterSwap,
      offeredShift.roster.startDate,
      offeredShift.roster.endDate
    );

    const requesterHoursViolations = this.hoursValidator.validateAllWorkingHours(
      requesterNewShift,
      requesterShiftsAfterSwap
    );

    if (requesterRestViolations.length > 0) {
      violations.push(
        ...requesterRestViolations.map((v) => `Requester: ${v.violation}`)
      );
    }

    if (requesterHoursViolations.length > 0) {
      violations.push(
        ...requesterHoursViolations.map((v) => `Requester: ${v.violation}`)
      );
    }

    // Simulate the swap for target
    const targetShiftsAfterSwap = targetShifts
      .filter((s) => s.id !== offeredShiftId)
      .map(convertToShiftData);
    const targetNewShift = convertToShiftData({
      ...requestedShift,
      userId: targetId,
    });

    // Validate target compliance
    const targetRestViolations = this.restValidator.validateAllRestPeriods(
      targetNewShift,
      targetShiftsAfterSwap,
      requestedShift.roster.startDate,
      requestedShift.roster.endDate
    );

    const targetHoursViolations = this.hoursValidator.validateAllWorkingHours(
      targetNewShift,
      targetShiftsAfterSwap
    );

    if (targetRestViolations.length > 0) {
      violations.push(...targetRestViolations.map((v) => `Target: ${v.violation}`));
    }

    if (targetHoursViolations.length > 0) {
      violations.push(...targetHoursViolations.map((v) => `Target: ${v.violation}`));
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }
}
