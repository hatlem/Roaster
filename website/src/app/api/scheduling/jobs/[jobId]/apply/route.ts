import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { applyAutoSchedule } from "@/services/autoSchedulerService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);

    const { jobId } = await params;

    await applyAutoSchedule(jobId, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Schedule applied successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Apply schedule error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply schedule" },
      { status: 500 }
    );
  }
}
