import webPush from "web-push";
import { prisma } from "./db";

// Configure web-push with VAPID credentials
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:hello@getia.no";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ success: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let success = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          ...payload,
          icon: payload.icon || "/icons/icon-192x192.png",
          badge: payload.badge || "/icons/icon-192x192.png",
        })
      );
      success++;
    } catch (error: unknown) {
      failed++;
      // Remove invalid subscriptions (410 Gone or 404 Not Found)
      const webPushError = error as { statusCode?: number };
      if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }

  return { success, failed };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ success: number; failed: number }> {
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed };
}

/**
 * Send push notification to all users in an organization
 */
export async function sendPushToOrganization(
  organizationId: string,
  payload: PushPayload,
  options?: { roles?: string[] }
): Promise<{ success: number; failed: number }> {
  const users = await prisma.user.findMany({
    where: {
      organizationId,
      ...(options?.roles && { role: { in: options.roles as never[] } }),
    },
    select: { id: true },
  });

  return sendPushToUsers(
    users.map((u) => u.id),
    payload
  );
}

/**
 * Notification templates for common events
 */
export const PushTemplates = {
  shiftPublished: (rosterName: string) => ({
    title: "New Schedule Published",
    body: `Your shifts for ${rosterName} are now available`,
    tag: "roster-published",
    data: { type: "ROSTER_PUBLISHED" },
  }),

  shiftChanged: (date: string) => ({
    title: "Shift Updated",
    body: `Your shift on ${date} has been modified`,
    tag: "shift-changed",
    data: { type: "SHIFT_CHANGED" },
  }),

  shiftClaimed: (employeeName: string) => ({
    title: "Shift Claimed",
    body: `${employeeName} has claimed your posted shift`,
    tag: "shift-claimed",
    data: { type: "SHIFT_CLAIMED" },
  }),

  approvalNeeded: (employeeName: string) => ({
    title: "Approval Required",
    body: `${employeeName} needs approval for a shift transfer`,
    tag: "approval-needed",
    actions: [
      { action: "approve", title: "Approve" },
      { action: "view", title: "View" },
    ],
    data: { type: "APPROVAL_NEEDED" },
  }),

  timeOffApproved: (dates: string) => ({
    title: "Time Off Approved",
    body: `Your time off request for ${dates} has been approved`,
    tag: "time-off-approved",
    data: { type: "TIME_OFF_APPROVED" },
  }),

  timeOffRejected: (dates: string) => ({
    title: "Time Off Rejected",
    body: `Your time off request for ${dates} was not approved`,
    tag: "time-off-rejected",
    data: { type: "TIME_OFF_REJECTED" },
  }),

  reminderClockIn: () => ({
    title: "Shift Starting Soon",
    body: "Don't forget to clock in for your shift",
    tag: "clock-reminder",
    data: { type: "CLOCK_REMINDER" },
  }),
};
