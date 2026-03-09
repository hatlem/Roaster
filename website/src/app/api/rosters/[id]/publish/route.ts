import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  requireRole,
  getOrganizationId,
} from "@/lib/api-utils";
import { sendPushToUsers, PushTemplates } from "@/lib/pushNotifications";
import { sendRosterPublishedEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/rosters/[id]/publish — Publish a roster
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);
    const { id } = await params;

    // Verify roster belongs to this org
    const roster = await prisma.roster.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!roster) {
      return errorResponse("Roster not found", 404);
    }

    if (roster.status === "PUBLISHED" || roster.status === "ACTIVE") {
      return errorResponse("Roster is already published", 400);
    }

    // Check 14-day rule: was this published at least 14 days before the start date?
    const now = new Date();
    const daysBeforeStart = Math.floor(
      (roster.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isLatePublication = daysBeforeStart < 14;

    // Update roster status to PUBLISHED
    const updated = await prisma.roster.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        publishedBy: session.user.id,
        isLatePublication,
      },
    });

    // Find all employees assigned to shifts in this roster
    const shifts = await prisma.shift.findMany({
      where: { rosterId: id, isCancelled: false },
      select: { userId: true, user: { select: { email: true } } },
    });

    // Deduplicate employees
    const employeeMap = new Map<string, string>();
    for (const shift of shifts) {
      if (shift.userId && shift.user?.email) {
        employeeMap.set(shift.userId, shift.user.email);
      }
    }

    const userIds = Array.from(employeeMap.keys());
    const startDate = roster.startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const endDate = roster.endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Fire-and-forget: push notifications + emails
    if (userIds.length > 0) {
      Promise.all([
        sendPushToUsers(userIds, PushTemplates.shiftPublished(roster.name)),
        ...Array.from(employeeMap.entries()).map(([, email]) =>
          sendRosterPublishedEmail(email, roster.name, startDate, endDate)
        ),
      ]).catch(console.error);
    }

    // Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          action: "ROSTER_PUBLISHED",
          entityType: "Roster",
          entityId: id,
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          rosterId: id,
          details: {
            rosterName: roster.name,
            publishedBy: session.user.email,
            isLatePublication,
            employeesNotified: userIds.length,
          },
          retainUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
        },
      });
    } catch {
      // Audit log creation is best-effort
    }

    return successResponse(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse("No organization found", 400);
    }
    console.error("Error publishing roster:", error);
    return errorResponse("Failed to publish roster", 500);
  }
}
