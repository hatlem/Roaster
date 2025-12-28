// Shift Marketplace Service
// Allows employees to claim available shifts and swap shifts

import { PrismaClient } from '@prisma/client';
import { AuditLogger } from './auditLogger';

const prisma = new PrismaClient();

export class ShiftMarketplaceService {
  private auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = new AuditLogger();
  }

  /**
   * Post a shift to the marketplace
   */
  async postShiftToMarketplace(data: {
    shiftId: string;
    postedBy: string;
    availableUntil: Date;
    reason?: string;
    eligibleRoles?: string[];
    eligibleUserIds?: string[];
  }) {
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
      include: { user: true, roster: true },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    // Check if shift can be posted (future shift, not already in marketplace)
    if (shift.startTime < new Date()) {
      throw new Error('Cannot post past shifts to marketplace');
    }

    // Create marketplace listing
    const listing = await prisma.shiftMarketplaceListing.create({
      data: {
        shiftId: data.shiftId,
        postedBy: data.postedBy,
        availableUntil: data.availableUntil,
        reason: data.reason,
        eligibleRoles: data.eligibleRoles || [],
        eligibleUserIds: data.eligibleUserIds || [],
        status: 'AVAILABLE',
      },
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'SHIFT_POSTED_TO_MARKETPLACE',
      entityType: 'ShiftMarketplaceListing',
      entityId: listing.id,
      userId: data.postedBy,
      details: {
        shiftId: data.shiftId,
        reason: data.reason,
      },
    });

    // TODO: Notify eligible employees
    // await notificationService.notifyShiftAvailable(listing);

    return listing;
  }

  /**
   * Claim a shift from marketplace
   */
  async claimShift(listingId: string, userId: string, userEmail: string) {
    const listing = await prisma.shiftMarketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        shift: {
          include: { user: true, roster: true },
        },
      },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'AVAILABLE') {
      throw new Error('Shift is no longer available');
    }

    if (new Date() > listing.availableUntil) {
      throw new Error('Claim deadline has passed');
    }

    // Check eligibility
    if (
      listing.eligibleUserIds.length > 0 &&
      !listing.eligibleUserIds.includes(userId)
    ) {
      throw new Error('You are not eligible to claim this shift');
    }

    // Update listing
    const claimed = await prisma.shiftMarketplaceListing.update({
      where: { id: listingId },
      data: {
        claimedBy: userId,
        claimedAt: new Date(),
        status: 'CLAIMED',
      },
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'SHIFT_CLAIMED',
      entityType: 'ShiftMarketplaceListing',
      entityId: listingId,
      userId,
      userEmail,
      details: {
        shiftId: listing.shiftId,
      },
    });

    // TODO: Notify manager for approval
    // await notificationService.notifyShiftClaimed(claimed);

    return claimed;
  }

  /**
   * Approve shift claim (manager action)
   */
  async approveShiftClaim(
    listingId: string,
    managerId: string,
    managerEmail: string
  ) {
    const listing = await prisma.shiftMarketplaceListing.findUnique({
      where: { id: listingId },
      include: { shift: true },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'CLAIMED') {
      throw new Error('Shift has not been claimed');
    }

    if (!listing.claimedBy) {
      throw new Error('No claimer found');
    }

    // Update listing
    const approved = await prisma.shiftMarketplaceListing.update({
      where: { id: listingId },
      data: {
        status: 'APPROVED',
        approvedBy: managerId,
        approvedAt: new Date(),
      },
    });

    // Reassign shift to new employee
    await prisma.shift.update({
      where: { id: listing.shiftId },
      data: {
        userId: listing.claimedBy,
        isChanged: true,
        changeReason: 'EMPLOYEE_REQUEST',
        changeNotes: `Claimed from marketplace by employee`,
        changedBy: managerId,
        changedAt: new Date(),
      },
    });

    // Log to audit
    await this.auditLogger.log({
      action: 'SHIFT_CLAIM_APPROVED',
      entityType: 'ShiftMarketplaceListing',
      entityId: listingId,
      userId: managerId,
      userEmail: managerEmail,
      details: {
        shiftId: listing.shiftId,
        newAssignee: listing.claimedBy,
      },
    });

    // TODO: Notify both employees
    // await notificationService.notifyShiftClaimApproved(approved);

    return approved;
  }

  /**
   * Get available shifts for an employee
   */
  async getAvailableShifts(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const listings = await prisma.shiftMarketplaceListing.findMany({
      where: {
        status: 'AVAILABLE',
        availableUntil: {
          gte: new Date(),
        },
        OR: [
          { eligibleUserIds: { isEmpty: true } }, // Open to all
          { eligibleUserIds: { has: userId } }, // Specifically eligible
        ],
      },
      include: {
        shift: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            roster: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        availableUntil: 'asc',
      },
    });

    return listings;
  }

  /**
   * Cancel marketplace listing
   */
  async cancelListing(listingId: string, userId: string, userEmail: string) {
    const listing = await prisma.shiftMarketplaceListing.update({
      where: { id: listingId },
      data: {
        status: 'CANCELLED',
      },
    });

    await this.auditLogger.log({
      action: 'MARKETPLACE_LISTING_CANCELLED',
      entityType: 'ShiftMarketplaceListing',
      entityId: listingId,
      userId,
      userEmail,
    });

    return listing;
  }
}
