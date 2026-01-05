import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAutoScheduleJob } from "@/services/autoSchedulerService";
import { SchedulePriorityMode } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rosterId, priorityMode } = body;

    if (!rosterId) {
      return NextResponse.json(
        { error: "rosterId is required" },
        { status: 400 }
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
    console.error("Auto-fill error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start auto-scheduling" },
      { status: 500 }
    );
  }
}
