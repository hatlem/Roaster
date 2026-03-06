import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { rejectAutoSchedule } from "@/services/autoSchedulerService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);

    const { jobId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    await rejectAutoSchedule(jobId, session.user.id, reason);

    return NextResponse.json({
      success: true,
      message: "Schedule rejected",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Reject schedule error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reject schedule" },
      { status: 500 }
    );
  }
}
