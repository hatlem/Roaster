// Background Job: Cleanup expired audit logs and old data
// Runs daily to maintain database hygiene and comply with retention policies

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/jobs.log' }),
    new winston.transports.Console(),
  ],
});

/**
 * Cleanup expired audit logs
 * Removes logs that have passed their retention period
 */
export async function cleanupExpiredAuditLogs(): Promise<void> {
  try {
    logger.info('Starting audit log cleanup...');

    const result = await prisma.auditLog.deleteMany({
      where: {
        retainUntil: {
          lt: new Date(),
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired audit logs`);
  } catch (error) {
    logger.error('Failed to cleanup audit logs:', error);
  }
}

/**
 * Cleanup old notifications
 * Removes read notifications older than 30 days
 */
export async function cleanupOldNotifications(): Promise<void> {
  try {
    logger.info('Starting notifications cleanup...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        readAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old notifications`);
  } catch (error) {
    logger.error('Failed to cleanup notifications:', error);
  }
}

/**
 * Archive completed rosters
 * Moves completed rosters older than 1 year to ARCHIVED status
 */
export async function archiveOldRosters(): Promise<void> {
  try {
    logger.info('Starting roster archival...');

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await prisma.roster.updateMany({
      where: {
        status: 'COMPLETED',
        endDate: {
          lt: oneYearAgo,
        },
      },
      data: {
        status: 'ARCHIVED',
      },
    });

    logger.info(`Archived ${result.count} old rosters`);
  } catch (error) {
    logger.error('Failed to archive rosters:', error);
  }
}

/**
 * Run all cleanup jobs
 */
export async function runCleanupJobs(): Promise<void> {
  logger.info('=== Running scheduled cleanup jobs ===');

  await cleanupExpiredAuditLogs();
  await cleanupOldNotifications();
  await archiveOldRosters();

  logger.info('=== Cleanup jobs completed ===');
}

/**
 * Schedule cleanup jobs
 * Runs daily at 2 AM
 */
export function scheduleCleanupJobs(): void {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    await runCleanupJobs();
  });

  logger.info('Cleanup jobs scheduled (daily at 2 AM)');
}

// Run on module load in production
if (process.env.NODE_ENV === 'production') {
  scheduleCleanupJobs();
}
