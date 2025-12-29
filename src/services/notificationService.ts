// Notification Service
// Sends notifications to employees about roster changes, marketplace, swaps, time-off, and more

import { PrismaClient, Shift } from '@prisma/client';

const prisma = new PrismaClient();

// Notification types for all competitive features
export type NotificationType =
  | 'ROSTER_PUBLISHED'
  | 'SHIFT_CHANGED'
  | 'SHIFT_ASSIGNED'
  | 'SHIFT_REMINDER'
  // Marketplace notifications
  | 'MARKETPLACE_SHIFT_AVAILABLE'
  | 'MARKETPLACE_SHIFT_CLAIMED'
  | 'MARKETPLACE_CLAIM_APPROVED'
  | 'MARKETPLACE_CLAIM_REJECTED'
  // Swap notifications
  | 'SWAP_REQUEST_RECEIVED'
  | 'SWAP_REQUEST_ACCEPTED'
  | 'SWAP_REQUEST_REJECTED'
  | 'SWAP_REQUEST_APPROVED'
  | 'SWAP_REQUEST_CANCELLED'
  // Time-off notifications
  | 'TIMEOFF_REQUEST_RECEIVED'
  | 'TIMEOFF_REQUEST_APPROVED'
  | 'TIMEOFF_REQUEST_REJECTED'
  // Communication notifications
  | 'MESSAGE_RECEIVED'
  | 'BROADCAST_RECEIVED'
  // Time clock notifications
  | 'CLOCK_REMINDER'
  | 'OVERTIME_WARNING'
  | 'COMPLIANCE_ALERT';

export class NotificationService {
  /**
   * Notify employee that roster has been published
   */
  async notifyRosterPublished(userId: string, rosterId: string, rosterName: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'ROSTER_PUBLISHED',
        title: 'New Roster Published',
        message: `The roster "${rosterName}" has been published. Check your upcoming shifts.`,
        relatedEntityType: 'Roster',
        relatedEntityId: rosterId,
      },
    });
  }

  /**
   * Notify all employees in a roster
   */
  async notifyAllEmployeesRosterPublished(shifts: Shift[], rosterName: string, rosterId: string): Promise<void> {
    const uniqueUserIds = [...new Set(shifts.map(s => s.userId))];

    await Promise.all(
      uniqueUserIds.map(userId =>
        this.notifyRosterPublished(userId, rosterId, rosterName)
      )
    );
  }

  /**
   * Notify employee that their shift has been changed
   */
  async notifyShiftChanged(
    userId: string,
    shift: Shift,
    changeReason: string
  ): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'SHIFT_CHANGED',
        title: 'Your Shift Has Been Modified',
        message: `Your shift on ${shift.startTime.toLocaleDateString('no-NO')} has been changed. Reason: ${changeReason}`,
        relatedEntityType: 'Shift',
        relatedEntityId: shift.id,
      },
    });
  }

  /**
   * Notify employee of shift assignment
   */
  async notifyShiftAssigned(userId: string, shift: Shift): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'SHIFT_ASSIGNED',
        title: 'New Shift Assigned',
        message: `You have been assigned a shift on ${shift.startTime.toLocaleDateString('no-NO')} from ${shift.startTime.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} to ${shift.endTime.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}`,
        relatedEntityType: 'Shift',
        relatedEntityId: shift.id,
      },
    });
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // ==========================================
  // MARKETPLACE NOTIFICATIONS
  // ==========================================

  /**
   * Notify eligible employees that a shift is available in marketplace
   */
  async notifyShiftAvailable(userIds: string[], shiftDate: Date, listingId: string): Promise<void> {
    const dateStr = shiftDate.toLocaleDateString('no-NO');
    await Promise.all(
      userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type: 'MARKETPLACE_SHIFT_AVAILABLE',
            title: 'Vakt tilgjengelig / Shift Available',
            message: `A shift on ${dateStr} is now available in the marketplace. Claim it before someone else does!`,
            relatedEntityType: 'ShiftMarketplaceListing',
            relatedEntityId: listingId,
          },
        })
      )
    );
  }

  /**
   * Notify original poster that their shift has been claimed
   */
  async notifyShiftClaimed(posterId: string, claimerName: string, shiftDate: Date, listingId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: posterId,
        type: 'MARKETPLACE_SHIFT_CLAIMED',
        title: 'Vakt krevd / Shift Claimed',
        message: `${claimerName} has claimed your shift on ${shiftDate.toLocaleDateString('no-NO')}. Awaiting manager approval.`,
        relatedEntityType: 'ShiftMarketplaceListing',
        relatedEntityId: listingId,
      },
    });
  }

  /**
   * Notify claimer that their claim was approved
   */
  async notifyClaimApproved(claimerId: string, shiftDate: Date, listingId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: claimerId,
        type: 'MARKETPLACE_CLAIM_APPROVED',
        title: 'Krav godkjent / Claim Approved',
        message: `Your claim for the shift on ${shiftDate.toLocaleDateString('no-NO')} has been approved. It's now on your schedule!`,
        relatedEntityType: 'ShiftMarketplaceListing',
        relatedEntityId: listingId,
      },
    });
  }

  /**
   * Notify claimer that their claim was rejected
   */
  async notifyClaimRejected(claimerId: string, shiftDate: Date, reason: string, listingId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: claimerId,
        type: 'MARKETPLACE_CLAIM_REJECTED',
        title: 'Krav avvist / Claim Rejected',
        message: `Your claim for the shift on ${shiftDate.toLocaleDateString('no-NO')} was rejected. Reason: ${reason}`,
        relatedEntityType: 'ShiftMarketplaceListing',
        relatedEntityId: listingId,
      },
    });
  }

  // ==========================================
  // SWAP NOTIFICATIONS
  // ==========================================

  /**
   * Notify target employee of swap request
   */
  async notifySwapRequestReceived(targetUserId: string, requesterName: string, shiftDate: Date, swapId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'SWAP_REQUEST_RECEIVED',
        title: 'Bytteforespørsel / Swap Request',
        message: `${requesterName} wants to swap shifts with you on ${shiftDate.toLocaleDateString('no-NO')}. Review and respond.`,
        relatedEntityType: 'ShiftSwapRequest',
        relatedEntityId: swapId,
      },
    });
  }

  /**
   * Notify requester that their swap was accepted
   */
  async notifySwapAccepted(requesterId: string, targetName: string, shiftDate: Date, swapId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'SWAP_REQUEST_ACCEPTED',
        title: 'Bytte akseptert / Swap Accepted',
        message: `${targetName} has accepted your swap request for ${shiftDate.toLocaleDateString('no-NO')}. Awaiting manager approval.`,
        relatedEntityType: 'ShiftSwapRequest',
        relatedEntityId: swapId,
      },
    });
  }

  /**
   * Notify requester that their swap was rejected
   */
  async notifySwapRejected(requesterId: string, targetName: string, reason: string, swapId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'SWAP_REQUEST_REJECTED',
        title: 'Bytte avvist / Swap Rejected',
        message: `${targetName} has rejected your swap request. Reason: ${reason}`,
        relatedEntityType: 'ShiftSwapRequest',
        relatedEntityId: swapId,
      },
    });
  }

  /**
   * Notify both employees that swap was approved
   */
  async notifySwapApproved(userIds: string[], swapId: string): Promise<void> {
    await Promise.all(
      userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type: 'SWAP_REQUEST_APPROVED',
            title: 'Bytte godkjent / Swap Approved',
            message: 'Your shift swap has been approved by management. Check your updated schedule.',
            relatedEntityType: 'ShiftSwapRequest',
            relatedEntityId: swapId,
          },
        })
      )
    );
  }

  /**
   * Notify target that swap request was cancelled
   */
  async notifySwapCancelled(targetUserId: string, requesterName: string, swapId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'SWAP_REQUEST_CANCELLED',
        title: 'Bytte kansellert / Swap Cancelled',
        message: `${requesterName} has cancelled their swap request.`,
        relatedEntityType: 'ShiftSwapRequest',
        relatedEntityId: swapId,
      },
    });
  }

  // ==========================================
  // TIME-OFF NOTIFICATIONS
  // ==========================================

  /**
   * Notify managers of new time-off request
   */
  async notifyTimeOffRequestReceived(managerIds: string[], employeeName: string, requestId: string, dates: string): Promise<void> {
    await Promise.all(
      managerIds.map(managerId =>
        prisma.notification.create({
          data: {
            userId: managerId,
            type: 'TIMEOFF_REQUEST_RECEIVED',
            title: 'Fraværsforespørsel / Time-Off Request',
            message: `${employeeName} has requested time off for ${dates}. Please review and approve/reject.`,
            relatedEntityType: 'TimeOffRequest',
            relatedEntityId: requestId,
          },
        })
      )
    );
  }

  /**
   * Notify employee their time-off was approved
   */
  async notifyTimeOffApproved(userId: string, dates: string, requestId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'TIMEOFF_REQUEST_APPROVED',
        title: 'Fravær godkjent / Time-Off Approved',
        message: `Your time-off request for ${dates} has been approved. Enjoy your time off!`,
        relatedEntityType: 'TimeOffRequest',
        relatedEntityId: requestId,
      },
    });
  }

  /**
   * Notify employee their time-off was rejected
   */
  async notifyTimeOffRejected(userId: string, dates: string, reason: string, requestId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'TIMEOFF_REQUEST_REJECTED',
        title: 'Fravær avvist / Time-Off Rejected',
        message: `Your time-off request for ${dates} was rejected. Reason: ${reason}`,
        relatedEntityType: 'TimeOffRequest',
        relatedEntityId: requestId,
      },
    });
  }

  // ==========================================
  // COMMUNICATION NOTIFICATIONS
  // ==========================================

  /**
   * Notify user of new message
   */
  async notifyMessageReceived(userId: string, senderName: string, messageId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'MESSAGE_RECEIVED',
        title: 'Ny melding / New Message',
        message: `You have a new message from ${senderName}.`,
        relatedEntityType: 'Message',
        relatedEntityId: messageId,
      },
    });
  }

  /**
   * Notify users of broadcast
   */
  async notifyBroadcastReceived(userIds: string[], title: string, broadcastId: string): Promise<void> {
    await Promise.all(
      userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type: 'BROADCAST_RECEIVED',
            title: 'Kunngjøring / Announcement',
            message: title,
            relatedEntityType: 'Broadcast',
            relatedEntityId: broadcastId,
          },
        })
      )
    );
  }

  // ==========================================
  // TIME CLOCK NOTIFICATIONS
  // ==========================================

  /**
   * Remind employee to clock in for upcoming shift
   */
  async notifyClockReminder(userId: string, shiftId: string, shiftTime: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'CLOCK_REMINDER',
        title: 'Påminnelse om stempling / Clock-In Reminder',
        message: `Your shift starts at ${shiftTime}. Don't forget to clock in!`,
        relatedEntityType: 'Shift',
        relatedEntityId: shiftId,
      },
    });
  }

  /**
   * Warn employee about approaching overtime
   */
  async notifyOvertimeWarning(userId: string, hoursWorked: number, limit: number): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'OVERTIME_WARNING',
        title: 'Overtidsvarsel / Overtime Warning',
        message: `You have worked ${hoursWorked.toFixed(1)} hours today. The daily limit is ${limit} hours. Consider ending your shift.`,
        relatedEntityType: 'User',
        relatedEntityId: userId,
      },
    });
  }

  /**
   * Alert about compliance issues
   */
  async notifyComplianceAlert(userId: string, issue: string, entityType: string, entityId: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'COMPLIANCE_ALERT',
        title: 'Samsvarsvarsel / Compliance Alert',
        message: issue,
        relatedEntityType: entityType,
        relatedEntityId: entityId,
      },
    });
  }

  // ==========================================
  // SHIFT REMINDERS
  // ==========================================

  /**
   * Remind employee of upcoming shift (1 hour before)
   */
  async notifyShiftReminder(userId: string, shift: Shift): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'SHIFT_REMINDER',
        title: 'Vaktpåminnelse / Shift Reminder',
        message: `Your shift starts in 1 hour at ${shift.startTime.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}. Location: ${shift.location || 'See schedule'}`,
        relatedEntityType: 'Shift',
        relatedEntityId: shift.id,
      },
    });
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get notification count by type for user
   */
  async getNotificationCountByType(userId: string): Promise<Record<string, number>> {
    const notifications = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        userId,
        isRead: false,
      },
      _count: {
        type: true,
      },
    });

    return notifications.reduce((acc, n) => {
      acc[n.type] = n._count.type;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        readAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
