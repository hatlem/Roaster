// Roster Service - Orchestrates all roster operations with compliance checks
// This is the main service that ties together all validation logic

import { PrismaClient, Roster, Shift, RosterStatus, ChangeReason } from '@prisma/client';
import { RestPeriodValidator } from './restPeriodValidator';
import { WorkingHoursValidator } from './workingHoursValidator';
import { PublishValidator } from './publishValidator';
import { AuditLogger } from './auditLogger';
import { getComplianceConfig } from '../config/compliance';
import { ShiftData, ValidationResult } from '../types';

const prisma = new PrismaClient();

export class RosterService {
  private restPeriodValidator: RestPeriodValidator;
  private workingHoursValidator: WorkingHoursValidator;
  private publishValidator: PublishValidator;
  private auditLogger: AuditLogger;

  constructor() {
    const config = getComplianceConfig();
    this.restPeriodValidator = new RestPeriodValidator(config);
    this.workingHoursValidator = new WorkingHoursValidator(config);
    this.publishValidator = new PublishValidator(config);
    this.auditLogger = new AuditLogger();
  }

  /**
   * Create a new roster in DRAFT status
   */
  async createRoster(
    organizationId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    createdBy: string,
    userEmail: string
  ): Promise<Roster> {
    const roster = await prisma.roster.create({
      data: {
        organizationId,
        name,
        startDate,
        endDate,
        status: RosterStatus.DRAFT,
        createdBy,
      },
    });

    await this.auditLogger.logRosterCreated(roster.id, createdBy, userEmail, {
      name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return roster;
  }

  /**
   * Add a shift to a roster with full compliance validation
   */
  async addShift(
    rosterId: string,
    userId: string,
    startTime: Date,
    endTime: Date,
    breakMinutes: number,
    department: string | undefined,
    location: string | undefined,
    notes: string | undefined,
    createdBy: string,
    createdByEmail: string
  ): Promise<{ shift: Shift; validation: ValidationResult }> {
    // Get roster and verify it's in editable state
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: { shifts: true },
    });

    if (!roster) {
      throw new Error('Roster not found');
    }

    if (roster.status !== RosterStatus.DRAFT && roster.status !== RosterStatus.IN_REVIEW) {
      throw new Error('Cannot modify a published roster. Create a change request instead.');
    }

    // Prepare shift data for validation
    const newShift: ShiftData = {
      startTime,
      endTime,
      breakMinutes,
      userId,
    };

    // Get existing shifts for this user
    const existingUserShifts: ShiftData[] = roster.shifts
      .filter((s) => s.userId === userId)
      .map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        breakMinutes: s.breakMinutes,
        userId: s.userId,
      }));

    // Validate rest periods
    const restViolations = this.restPeriodValidator.validateAllRestPeriods(
      newShift,
      existingUserShifts,
      roster.startDate,
      roster.endDate
    );

    // Validate working hours
    const hoursViolations = this.workingHoursValidator.validateAllWorkingHours(
      newShift,
      existingUserShifts
    );

    // Compile validation results
    const violations: string[] = [
      ...restViolations.map((v) => v.violation),
      ...hoursViolations.map((v) => v.violation),
    ];

    const warnings: string[] = [];
    if (violations.length > 0) {
      warnings.push(
        'This shift has compliance violations. Review and approve before publishing.'
      );
    }

    // Create the shift with violation flags
    const shift = await prisma.shift.create({
      data: {
        rosterId,
        userId,
        startTime,
        endTime,
        breakMinutes,
        department,
        location,
        notes,
        violatesRestPeriod: restViolations.length > 0,
        violatesDailyLimit: hoursViolations.some((v) => v.type === 'DAILY'),
        violatesWeeklyLimit: hoursViolations.some((v) => v.type === 'WEEKLY'),
        isOvertime: hoursViolations.some((v) =>
          v.type.startsWith('OVERTIME')
        ),
      },
    });

    // Log shift creation
    await this.auditLogger.logShiftCreated(
      shift.id,
      rosterId,
      createdBy,
      createdByEmail,
      userId,
      violations
    );

    return {
      shift,
      validation: {
        isValid: violations.length === 0,
        violations,
        warnings,
      },
    };
  }

  /**
   * Publish a roster (implements 14-day rule)
   */
  async publishRoster(
    rosterId: string,
    publishedBy: string,
    publishedByEmail: string
  ): Promise<{ roster: Roster; validation: ValidationResult }> {
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: { shifts: true },
    });

    if (!roster) {
      throw new Error('Roster not found');
    }

    if (roster.status === RosterStatus.PUBLISHED) {
      throw new Error('Roster is already published');
    }

    // Validate 14-day rule
    const publishValidation = this.publishValidator.validatePublish(roster.startDate);

    // Check for shift violations
    const shiftsWithViolations = roster.shifts.filter(
      (s) => s.violatesRestPeriod || s.violatesDailyLimit || s.violatesWeeklyLimit
    );

    const warnings = [...publishValidation.warnings];
    if (shiftsWithViolations.length > 0) {
      warnings.push(
        `WARNING: ${shiftsWithViolations.length} shifts have compliance violations`
      );
    }

    // Update roster to PUBLISHED status
    const publishedRoster = await prisma.roster.update({
      where: { id: rosterId },
      data: {
        status: RosterStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedBy,
        isLatePublication: publishValidation.isLate,
      },
    });

    // Log publication
    await this.auditLogger.logRosterPublished(
      rosterId,
      publishedBy,
      publishedByEmail,
      publishValidation.isLate,
      publishValidation.daysUntilStart
    );

    // Send notifications to all employees (implemented separately)
    // await this.notificationService.notifyRosterPublished(roster.shifts);

    return {
      roster: publishedRoster,
      validation: {
        isValid: !publishValidation.isLate && shiftsWithViolations.length === 0,
        violations: publishValidation.isLate
          ? ['Roster published after 14-day deadline']
          : [],
        warnings,
      },
    };
  }

  /**
   * Modify a published shift (requires reason and logging)
   */
  async modifyPublishedShift(
    shiftId: string,
    startTime: Date,
    endTime: Date,
    reason: ChangeReason,
    changeNotes: string,
    modifiedBy: string,
    modifiedByEmail: string
  ): Promise<{ shift: Shift; validation: ValidationResult }> {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { roster: true },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.roster.status !== RosterStatus.PUBLISHED) {
      throw new Error('Can only modify published shifts using this method');
    }

    // Store original times if not already stored
    const originalStartTime = shift.originalStartTime || shift.startTime;
    const originalEndTime = shift.originalEndTime || shift.endTime;

    // Update shift
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        startTime,
        endTime,
        isChanged: true,
        originalStartTime,
        originalEndTime,
        changeReason: reason,
        changeNotes,
        changedAt: new Date(),
        changedBy: modifiedBy,
      },
    });

    // Log modification
    await this.auditLogger.logShiftModified(
      shiftId,
      shift.rosterId,
      modifiedBy,
      modifiedByEmail,
      {
        originalStartTime: originalStartTime.toISOString(),
        originalEndTime: originalEndTime.toISOString(),
        newStartTime: startTime.toISOString(),
        newEndTime: endTime.toISOString(),
      },
      changeNotes
    );

    // Send notification to employee
    // await this.notificationService.notifyShiftChanged(shift.userId, updatedShift, reason);

    return {
      shift: updatedShift,
      validation: {
        isValid: true,
        violations: [],
        warnings: ['Shift was modified after roster publication'],
      },
    };
  }

  /**
   * Get roster with all shifts and validation status
   */
  async getRosterWithValidation(rosterId: string) {
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        shifts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeNumber: true,
                department: true,
              },
            },
          },
        },
        organization: true,
      },
    });

    if (!roster) {
      throw new Error('Roster not found');
    }

    // Calculate compliance summary
    const totalShifts = roster.shifts.length;
    const shiftsWithViolations = roster.shifts.filter(
      (s) => s.violatesRestPeriod || s.violatesDailyLimit || s.violatesWeeklyLimit
    ).length;
    const changedShifts = roster.shifts.filter((s) => s.isChanged).length;

    let publishStatus = 'Not Published';
    if (roster.publishedAt) {
      const validation = this.publishValidator.validatePublish(
        roster.startDate,
        roster.publishedAt
      );
      publishStatus = validation.isLate ? 'Published Late (VIOLATION)' : 'Published On Time';
    }

    return {
      roster,
      complianceSummary: {
        totalShifts,
        shiftsWithViolations,
        changedShifts,
        publishStatus,
        isLatePublication: roster.isLatePublication,
      },
    };
  }

  /**
   * Send roster for review by employee representative
   */
  async sendForReview(
    rosterId: string,
    sentBy: string,
    sentByEmail: string
  ): Promise<Roster> {
    const roster = await prisma.roster.update({
      where: { id: rosterId },
      data: {
        status: RosterStatus.IN_REVIEW,
        sentForReviewAt: new Date(),
      },
    });

    await this.auditLogger.log({
      action: 'ROSTER_SENT_FOR_REVIEW',
      entityType: 'Roster',
      entityId: rosterId,
      userId: sentBy,
      userEmail: sentByEmail,
      rosterId,
    });

    return roster;
  }

  /**
   * Approve roster (by representative)
   */
  async approveRoster(
    rosterId: string,
    reviewedBy: string,
    reviewedByEmail: string,
    comments?: string
  ): Promise<Roster> {
    const roster = await prisma.roster.update({
      where: { id: rosterId },
      data: {
        reviewedBy,
        reviewedAt: new Date(),
        reviewComments: comments,
      },
    });

    await this.auditLogger.log({
      action: 'ROSTER_APPROVED',
      entityType: 'Roster',
      entityId: rosterId,
      userId: reviewedBy,
      userEmail: reviewedByEmail,
      details: { comments },
      rosterId,
    });

    return roster;
  }
}
