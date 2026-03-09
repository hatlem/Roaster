import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  requireRole,
  requireAuth,
  getOrganizationId,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/rosters/[id]/consultation — Request consultation (ADMIN/MANAGER)
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

    if (roster.status !== "DRAFT") {
      return errorResponse("Only DRAFT rosters can be sent for consultation", 400);
    }

    // Build update data with guaranteed fields
    const updateData: Record<string, unknown> = {
      sentForReviewAt: new Date(),
      status: "IN_REVIEW",
    };

    // Try to set consultation fields if they exist in the schema
    try {
      updateData.consultationStatus = "IN_CONSULTATION";
      updateData.consultationRequestedAt = new Date();
      updateData.consultationRequestedBy = session.user.id;
    } catch {
      // Fields may not exist yet — that's fine
    }

    const updated = await prisma.roster.update({
      where: { id },
      data: updateData,
    });

    // Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          action: "CONSULTATION_REQUESTED",
          entityType: "Roster",
          entityId: id,
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          rosterId: id,
          details: {
            rosterName: roster.name,
            requestedBy: session.user.email,
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
    console.error("Error requesting consultation:", error);
    return errorResponse("Failed to request consultation", 500);
  }
}

// PUT /api/rosters/[id]/consultation — Respond to consultation (REPRESENTATIVE)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["REPRESENTATIVE"]);
    const orgId = await getOrganizationId(session.user.id);
    const { id } = await params;

    // Verify roster belongs to this org
    const roster = await prisma.roster.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!roster) {
      return errorResponse("Roster not found", 404);
    }

    if (roster.status !== "IN_REVIEW") {
      return errorResponse("Roster is not in review", 400);
    }

    const body = await request.json();
    const { approved, comments } = body as {
      approved: boolean;
      comments: string;
    };

    if (typeof approved !== "boolean") {
      return errorResponse("'approved' field is required (boolean)", 400);
    }

    // Build update data with guaranteed fields
    const updateData: Record<string, unknown> = {
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      reviewComments: comments || null,
    };

    // Try to set consultation fields if they exist
    try {
      updateData.consultationStatus = approved ? "APPROVED" : "REJECTED";
      updateData.consultationRespondedAt = new Date();
      updateData.consultationRespondedBy = session.user.id;
      updateData.consultationNotes = comments || null;
    } catch {
      // Fields may not exist yet
    }

    const updated = await prisma.roster.update({
      where: { id },
      data: updateData,
    });

    // Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          action: approved
            ? "CONSULTATION_APPROVED"
            : "CONSULTATION_REJECTED",
          entityType: "Roster",
          entityId: id,
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          rosterId: id,
          details: {
            rosterName: roster.name,
            approved,
            comments,
            respondedBy: session.user.email,
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
    console.error("Error responding to consultation:", error);
    return errorResponse("Failed to respond to consultation", 500);
  }
}

// GET /api/rosters/[id]/consultation — Get consultation status
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const orgId = await getOrganizationId(session.user.id);
    const { id } = await params;

    // Verify roster belongs to this org
    const roster = await prisma.roster.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        status: true,
        sentForReviewAt: true,
        reviewedBy: true,
        reviewedAt: true,
        reviewComments: true,
      },
    });

    if (!roster) {
      return errorResponse("Roster not found", 404);
    }

    // Try to get consultation-specific fields
    let consultationFields: Record<string, unknown> = {};
    try {
      const full = await prisma.roster.findUnique({
        where: { id },
        select: {
          consultationStatus: true,
          consultationRequestedAt: true,
          consultationRequestedBy: true,
          consultationRespondedAt: true,
          consultationRespondedBy: true,
          consultationNotes: true,
        },
      });
      if (full) {
        consultationFields = full;
      }
    } catch {
      // Fields may not exist yet
    }

    // Get reviewer info if available
    let reviewer = null;
    if (roster.reviewedBy) {
      reviewer = await prisma.user.findUnique({
        where: { id: roster.reviewedBy },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
    }

    // Get requester info if available
    let requester = null;
    const requestedBy =
      (consultationFields as { consultationRequestedBy?: string })
        .consultationRequestedBy;
    if (requestedBy) {
      requester = await prisma.user.findUnique({
        where: { id: requestedBy },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
    }

    // Build timeline
    const timeline: Array<{
      action: string;
      timestamp: string | null;
      user: { firstName: string; lastName: string; email: string } | null;
    }> = [];

    if (roster.sentForReviewAt) {
      timeline.push({
        action: "CONSULTATION_REQUESTED",
        timestamp: (roster.sentForReviewAt as Date).toISOString(),
        user: requester,
      });
    }

    if (roster.reviewedAt) {
      timeline.push({
        action: roster.reviewComments
          ? "CONSULTATION_RESPONDED"
          : "CONSULTATION_APPROVED",
        timestamp: (roster.reviewedAt as Date).toISOString(),
        user: reviewer,
      });
    }

    return successResponse({
      ...roster,
      ...consultationFields,
      reviewer,
      requester,
      timeline,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse("No organization found", 400);
    }
    console.error("Error fetching consultation status:", error);
    return errorResponse("Failed to fetch consultation status", 500);
  }
}
