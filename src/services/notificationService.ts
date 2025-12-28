// Notification Service
// Sends notifications to employees about roster changes

import { PrismaClient, Shift } from '@prisma/client';

const prisma = new PrismaClient();

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
}
