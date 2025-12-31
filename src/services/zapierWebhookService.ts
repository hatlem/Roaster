/**
 * Zapier Webhook Service
 *
 * Manages webhook subscriptions for Zapier triggers and dispatches events
 * to subscribed webhooks when roster events occur.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Notification types matching the NotificationService
export type NotificationType =
  | 'ROSTER_PUBLISHED'
  | 'SHIFT_CHANGED'
  | 'SHIFT_ASSIGNED'
  | 'SHIFT_REMINDER'
  | 'MARKETPLACE_SHIFT_AVAILABLE'
  | 'MARKETPLACE_SHIFT_CLAIMED'
  | 'MARKETPLACE_CLAIM_APPROVED'
  | 'MARKETPLACE_CLAIM_REJECTED'
  | 'SWAP_REQUEST_RECEIVED'
  | 'SWAP_REQUEST_ACCEPTED'
  | 'SWAP_REQUEST_REJECTED'
  | 'SWAP_REQUEST_APPROVED'
  | 'SWAP_REQUEST_CANCELLED'
  | 'TIMEOFF_REQUEST_RECEIVED'
  | 'TIMEOFF_REQUEST_APPROVED'
  | 'TIMEOFF_REQUEST_REJECTED'
  | 'MESSAGE_RECEIVED'
  | 'BROADCAST_RECEIVED'
  | 'CLOCK_REMINDER'
  | 'OVERTIME_WARNING'
  | 'COMPLIANCE_ALERT';

// Zapier event types that can trigger webhooks
export type ZapierEventType =
  | 'roster.published'
  | 'roster.late_publication'
  | 'shift.assigned'
  | 'shift.changed'
  | 'shift.deleted'
  | 'marketplace.shift_available'
  | 'marketplace.shift_claimed'
  | 'marketplace.claim_approved'
  | 'swap.request_received'
  | 'swap.approved'
  | 'timeoff.request_received'
  | 'timeoff.approved'
  | 'timeoff.rejected'
  | 'compliance.violation';

// Map notification types to Zapier events
const NOTIFICATION_TO_ZAPIER_EVENT: Partial<Record<NotificationType, ZapierEventType>> = {
  ROSTER_PUBLISHED: 'roster.published',
  SHIFT_ASSIGNED: 'shift.assigned',
  SHIFT_CHANGED: 'shift.changed',
  MARKETPLACE_SHIFT_AVAILABLE: 'marketplace.shift_available',
  MARKETPLACE_SHIFT_CLAIMED: 'marketplace.shift_claimed',
  MARKETPLACE_CLAIM_APPROVED: 'marketplace.claim_approved',
  SWAP_REQUEST_RECEIVED: 'swap.request_received',
  SWAP_REQUEST_APPROVED: 'swap.approved',
  TIMEOFF_REQUEST_RECEIVED: 'timeoff.request_received',
  TIMEOFF_REQUEST_APPROVED: 'timeoff.approved',
  TIMEOFF_REQUEST_REJECTED: 'timeoff.rejected',
  COMPLIANCE_ALERT: 'compliance.violation',
};

export interface ZapierWebhookPayload {
  id: string;
  event: ZapierEventType;
  timestamp: string;
  organization: {
    id: string;
    name: string;
  };
  data: Record<string, unknown>;
}

export interface WebhookSubscription {
  id: string;
  organizationId: string;
  webhookUrl: string;
  events: ZapierEventType[];
  isActive: boolean;
  secret: string;
  createdAt: Date;
}

export class ZapierWebhookService {
  /**
   * Create a webhook subscription
   */
  async createSubscription(params: {
    organizationId: string;
    webhookUrl: string;
    events: ZapierEventType[];
  }): Promise<WebhookSubscription> {
    const secret = crypto.randomBytes(32).toString('hex');

    const subscription = await prisma.zapierWebhook.create({
      data: {
        organizationId: params.organizationId,
        webhookUrl: params.webhookUrl,
        events: params.events,
        secret,
        isActive: true,
      },
    });

    return {
      id: subscription.id,
      organizationId: subscription.organizationId,
      webhookUrl: subscription.webhookUrl,
      events: subscription.events as ZapierEventType[],
      isActive: subscription.isActive,
      secret: subscription.secret,
      createdAt: subscription.createdAt,
    };
  }

  /**
   * Delete a webhook subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    await prisma.zapierWebhook.delete({
      where: { id: subscriptionId },
    });
  }

  /**
   * Get subscriptions for an organization
   */
  async getSubscriptions(organizationId: string): Promise<WebhookSubscription[]> {
    const subscriptions = await prisma.zapierWebhook.findMany({
      where: { organizationId, isActive: true },
    });

    return subscriptions.map(s => ({
      id: s.id,
      organizationId: s.organizationId,
      webhookUrl: s.webhookUrl,
      events: s.events as ZapierEventType[],
      isActive: s.isActive,
      secret: s.secret,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Dispatch event to all subscribed webhooks
   */
  async dispatchEvent(params: {
    organizationId: string;
    event: ZapierEventType;
    data: Record<string, unknown>;
  }): Promise<{ success: number; failed: number }> {
    const { organizationId, event, data } = params;

    // Get organization info
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      return { success: 0, failed: 0 };
    }

    // Get active subscriptions for this event
    const subscriptions = await prisma.zapierWebhook.findMany({
      where: {
        organizationId,
        isActive: true,
        events: { has: event },
      },
    });

    if (subscriptions.length === 0) {
      return { success: 0, failed: 0 };
    }

    const payload: ZapierWebhookPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      organization: {
        id: organization.id,
        name: organization.name,
      },
      data,
    };

    let success = 0;
    let failed = 0;

    // Dispatch to each subscription
    for (const subscription of subscriptions) {
      try {
        const signature = this.generateSignature(payload, subscription.secret);

        const response = await fetch(subscription.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Zapier-Signature': signature,
            'X-Zapier-Event': event,
            'X-Zapier-Delivery-ID': payload.id,
          },
          body: JSON.stringify(payload),
        });

        // Log delivery attempt
        await prisma.zapierWebhookDelivery.create({
          data: {
            webhookId: subscription.id,
            eventType: event,
            payload: payload as object,
            statusCode: response.status,
            success: response.ok,
          },
        });

        if (response.ok) {
          success++;
          // Reset error count on success
          await prisma.zapierWebhook.update({
            where: { id: subscription.id },
            data: {
              lastDeliveredAt: new Date(),
              errorCount: 0,
            },
          });
        } else {
          failed++;
          await this.handleDeliveryFailure(subscription.id);
        }
      } catch (error) {
        failed++;
        await this.handleDeliveryFailure(subscription.id);

        // Log failed delivery
        await prisma.zapierWebhookDelivery.create({
          data: {
            webhookId: subscription.id,
            eventType: event,
            payload: payload as object,
            statusCode: null,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    return { success, failed };
  }

  /**
   * Dispatch event from notification type
   */
  async dispatchFromNotification(params: {
    organizationId: string;
    notificationType: NotificationType;
    data: Record<string, unknown>;
  }): Promise<void> {
    const zapierEvent = NOTIFICATION_TO_ZAPIER_EVENT[params.notificationType];
    if (!zapierEvent) {
      return;
    }

    await this.dispatchEvent({
      organizationId: params.organizationId,
      event: zapierEvent,
      data: params.data,
    });
  }

  /**
   * Handle webhook delivery failure
   */
  private async handleDeliveryFailure(webhookId: string): Promise<void> {
    const webhook = await prisma.zapierWebhook.update({
      where: { id: webhookId },
      data: {
        errorCount: { increment: 1 },
        lastErrorAt: new Date(),
      },
    });

    // Disable webhook after 10 consecutive failures
    if (webhook.errorCount >= 10) {
      await prisma.zapierWebhook.update({
        where: { id: webhookId },
        data: { isActive: false },
      });
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: object, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify webhook signature (for incoming Zapier actions)
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expectedSignature}`),
      Buffer.from(signature)
    );
  }

  /**
   * Test webhook URL
   */
  async testWebhook(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testPayload: ZapierWebhookPayload = {
        id: crypto.randomUUID(),
        event: 'roster.published',
        timestamp: new Date().toISOString(),
        organization: {
          id: 'test-org',
          name: 'Test Organization',
        },
        data: {
          test: true,
          message: 'This is a test webhook from Roaster',
        },
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Zapier-Event': 'test',
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        return { success: true };
      }

      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available event types
   */
  getAvailableEvents(): { event: ZapierEventType; description: string }[] {
    return [
      { event: 'roster.published', description: 'When a roster is published' },
      { event: 'roster.late_publication', description: 'When a roster is published after the 14-day deadline' },
      { event: 'shift.assigned', description: 'When an employee is assigned to a shift' },
      { event: 'shift.changed', description: 'When a shift is modified' },
      { event: 'shift.deleted', description: 'When a shift is deleted' },
      { event: 'marketplace.shift_available', description: 'When a shift is posted to the marketplace' },
      { event: 'marketplace.shift_claimed', description: 'When an employee claims a marketplace shift' },
      { event: 'marketplace.claim_approved', description: 'When a marketplace claim is approved' },
      { event: 'swap.request_received', description: 'When a shift swap is requested' },
      { event: 'swap.approved', description: 'When a shift swap is approved' },
      { event: 'timeoff.request_received', description: 'When an employee requests time off' },
      { event: 'timeoff.approved', description: 'When time off is approved' },
      { event: 'timeoff.rejected', description: 'When time off is rejected' },
      { event: 'compliance.violation', description: 'When a compliance issue is detected' },
    ];
  }
}

export const zapierWebhookService = new ZapierWebhookService();
