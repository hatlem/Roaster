// Team Communication Service
// Handles internal messaging for teams, direct messages, and broadcasts

import { PrismaClient, Message, Broadcast, UserRole } from '@prisma/client';
import { AuditLogger } from './auditLogger';

const prisma = new PrismaClient();
const auditLogger = new AuditLogger();

export interface MessageWithDetails extends Message {
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  roster?: {
    id: string;
    name: string;
  } | null;
  replies?: MessageWithDetails[];
}

export interface BroadcastWithDetails extends Broadcast {
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  roster?: {
    id: string;
    name: string;
  } | null;
}

export class TeamCommunicationService {
  /**
   * Send a direct message to another employee
   */
  async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    rosterId?: string,
    parentId?: string,
    userEmail?: string
  ): Promise<MessageWithDetails> {
    // Validate that sender and recipient exist and are active
    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: recipientId } }),
    ]);

    if (!sender || !sender.isActive) {
      throw new Error('Sender not found or inactive');
    }

    if (!recipient || !recipient.isActive) {
      throw new Error('Recipient not found or inactive');
    }

    // If rosterId is provided, validate it exists
    if (rosterId) {
      const roster = await prisma.roster.findUnique({ where: { id: rosterId } });
      if (!roster) {
        throw new Error('Roster not found');
      }
    }

    // If parentId is provided, validate it exists
    if (parentId) {
      const parentMessage = await prisma.message.findUnique({ where: { id: parentId } });
      if (!parentMessage) {
        throw new Error('Parent message not found');
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        content,
        rosterId,
        parentId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        roster: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log the action
    await auditLogger.log({
      action: 'MESSAGE_SENT',
      entityType: 'Message',
      entityId: message.id,
      userId: senderId,
      userEmail: userEmail || sender.email,
      details: {
        recipientId,
        rosterId,
        parentId,
        isReply: !!parentId,
      },
      rosterId,
    });

    return message as MessageWithDetails;
  }

  /**
   * Get messages for a user (both sent and received)
   */
  async getUserMessages(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      rosterId?: string;
    } = {}
  ): Promise<{ messages: MessageWithDetails[]; total: number }> {
    const { limit = 50, offset = 0, unreadOnly = false, rosterId } = options;

    const whereClause: any = {
      OR: [
        { senderId: userId },
        { recipientId: userId },
      ],
      parentId: null, // Only fetch root messages, not replies
    };

    if (unreadOnly) {
      whereClause.AND = [
        { recipientId: userId },
        { isRead: false },
      ];
      delete whereClause.OR;
    }

    if (rosterId) {
      whereClause.rosterId = rosterId;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          roster: {
            select: {
              id: true,
              name: true,
            },
          },
          replies: {
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
              recipient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.message.count({ where: whereClause }),
    ]);

    return {
      messages: messages as MessageWithDetails[],
      total,
    };
  }

  /**
   * Get a single message with its thread (all replies)
   */
  async getMessageWithThread(messageId: string, userId: string): Promise<MessageWithDetails> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        roster: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            recipient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user has access to this message
    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new Error('Unauthorized access to message');
    }

    return message as MessageWithDetails;
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string, userId: string, userEmail?: string): Promise<Message> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only the recipient can mark a message as read
    if (message.recipientId !== userId) {
      throw new Error('Only the recipient can mark a message as read');
    }

    // Already read
    if (message.isRead) {
      return message;
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Log the action
    await auditLogger.log({
      action: 'MESSAGE_READ',
      entityType: 'Message',
      entityId: messageId,
      userId,
      userEmail,
      details: {
        senderId: message.senderId,
      },
      rosterId: message.rosterId || undefined,
    });

    return updatedMessage;
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
  }

  /**
   * Send a broadcast message to a team, department, or roster
   */
  async sendBroadcast(
    senderId: string,
    title: string,
    content: string,
    audience: 'ALL' | 'DEPARTMENT' | 'ROSTER',
    options: {
      departmentId?: string;
      rosterId?: string;
    } = {},
    userEmail?: string
  ): Promise<BroadcastWithDetails> {
    // Validate sender exists and has permission (must be MANAGER or ADMIN)
    const sender = await prisma.user.findUnique({ where: { id: senderId } });

    if (!sender || !sender.isActive) {
      throw new Error('Sender not found or inactive');
    }

    if (sender.role !== UserRole.MANAGER && sender.role !== UserRole.ADMIN) {
      throw new Error('Only managers and admins can send broadcasts');
    }

    // Validate audience-specific requirements
    if (audience === 'ROSTER' && !options.rosterId) {
      throw new Error('Roster ID is required for roster broadcasts');
    }

    if (audience === 'DEPARTMENT' && !options.departmentId) {
      throw new Error('Department ID is required for department broadcasts');
    }

    // If rosterId is provided, validate it exists
    if (options.rosterId) {
      const roster = await prisma.roster.findUnique({ where: { id: options.rosterId } });
      if (!roster) {
        throw new Error('Roster not found');
      }
    }

    // Create the broadcast
    const broadcast = await prisma.broadcast.create({
      data: {
        senderId,
        title,
        content,
        audience,
        departmentId: options.departmentId,
        rosterId: options.rosterId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        roster: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log the action
    await auditLogger.log({
      action: 'BROADCAST_SENT',
      entityType: 'Broadcast',
      entityId: broadcast.id,
      userId: senderId,
      userEmail: userEmail || sender.email,
      details: {
        audience,
        departmentId: options.departmentId,
        rosterId: options.rosterId,
        title,
      },
      rosterId: options.rosterId,
    });

    // Create individual messages for affected users based on audience
    await this.createBroadcastMessages(broadcast, audience, options);

    return broadcast as BroadcastWithDetails;
  }

  /**
   * Create individual messages for broadcast recipients
   */
  private async createBroadcastMessages(
    broadcast: Broadcast,
    audience: 'ALL' | 'DEPARTMENT' | 'ROSTER',
    options: {
      departmentId?: string;
      rosterId?: string;
    }
  ): Promise<void> {
    let recipients: { id: string }[] = [];

    if (audience === 'ALL') {
      // Get all active users
      recipients = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
    } else if (audience === 'DEPARTMENT' && options.departmentId) {
      // Get all users in the department
      recipients = await prisma.user.findMany({
        where: {
          department: options.departmentId,
          isActive: true,
        },
        select: { id: true },
      });
    } else if (audience === 'ROSTER' && options.rosterId) {
      // Get all users assigned to shifts in the roster
      const shifts = await prisma.shift.findMany({
        where: { rosterId: options.rosterId },
        select: { userId: true },
        distinct: ['userId'],
      });
      recipients = shifts.map(s => ({ id: s.userId }));
    }

    // Filter out the sender
    recipients = recipients.filter(r => r.id !== broadcast.senderId);

    // Create messages for each recipient
    const messagePromises = recipients.map(recipient =>
      prisma.message.create({
        data: {
          senderId: broadcast.senderId,
          recipientId: recipient.id,
          content: `${broadcast.title}\n\n${broadcast.content}`,
          rosterId: broadcast.rosterId,
        },
      })
    );

    await Promise.all(messagePromises);
  }

  /**
   * Get broadcasts for a user (either sent by them or relevant to them)
   */
  async getBroadcasts(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      sentByUser?: boolean;
    } = {}
  ): Promise<{ broadcasts: BroadcastWithDetails[]; total: number }> {
    const { limit = 50, offset = 0, sentByUser = false } = options;

    let whereClause: any = {};

    if (sentByUser) {
      whereClause.senderId = userId;
    } else {
      // Get broadcasts relevant to the user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });

      // Get rosters the user is part of
      const shifts = await prisma.shift.findMany({
        where: { userId },
        select: { rosterId: true },
        distinct: ['rosterId'],
      });
      const rosterIds = shifts.map(s => s.rosterId);

      whereClause.OR = [
        { audience: 'ALL' },
        { audience: 'DEPARTMENT', departmentId: user?.department },
        { audience: 'ROSTER', rosterId: { in: rosterIds } },
      ];
    }

    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          roster: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.broadcast.count({ where: whereClause }),
    ]);

    return {
      broadcasts: broadcasts as BroadcastWithDetails[],
      total,
    };
  }

  /**
   * Get roster-specific announcements
   */
  async getRosterAnnouncements(rosterId: string): Promise<BroadcastWithDetails[]> {
    const roster = await prisma.roster.findUnique({ where: { id: rosterId } });

    if (!roster) {
      throw new Error('Roster not found');
    }

    const broadcasts = await prisma.broadcast.findMany({
      where: {
        rosterId,
        audience: 'ROSTER',
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        roster: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return broadcasts as BroadcastWithDetails[];
  }

  /**
   * Delete a message (only sender can delete)
   */
  async deleteMessage(messageId: string, userId: string, userEmail?: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only the sender can delete a message
    if (message.senderId !== userId) {
      throw new Error('Only the sender can delete a message');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    // Log the action
    await auditLogger.log({
      action: 'MESSAGE_DELETED',
      entityType: 'Message',
      entityId: messageId,
      userId,
      userEmail,
      details: {
        recipientId: message.recipientId,
        rosterId: message.rosterId,
      },
      rosterId: message.rosterId || undefined,
    });
  }
}
