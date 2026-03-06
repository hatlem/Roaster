import { NextRequest, NextResponse } from "next/server";
import { requireRole, getOrganizationId } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { createAutoScheduleJob } from "@/services/autoSchedulerService";
import { SchedulePriorityMode } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const body = await request.json();
    const { rosterId, priorityMode } = body;

    if (!rosterId) {
      return NextResponse.json(
        { error: "rosterId is required" },
        { status: 400 }
      );
    }

    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      select: { organizationId: true },
    });
    if (!roster || roster.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Roster not found" },
        { status: 404 }
      );
    }

    // Validate priority mode
    const validModes: SchedulePriorityMode[] = [
      "LOWEST_COST",
      "EQUAL_HOURS",
      "PREFERENCE_BASED",
    ];
    if (!priorityMode || !validModes.includes(priorityMode)) {
      return NextResponse.json(
        {
          error: "Invalid priorityMode. Must be one of: LOWEST_COST, EQUAL_HOURS, PREFERENCE_BASED",
        },
        { status: 400 }
      );
    }

    // Create auto-schedule job
    const jobId = await createAutoScheduleJob(
      rosterId,
      priorityMode as SchedulePriorityMode,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      jobId,
      message: "Auto-scheduling job started",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }
    console.error("Auto-fill error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start auto-scheduling" },
      { status: 500 }
    );
  }
}
