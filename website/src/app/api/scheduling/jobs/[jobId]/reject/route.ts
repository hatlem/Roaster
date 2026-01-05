import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rejectAutoSchedule } from "@/services/autoSchedulerService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Reject schedule error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reject schedule" },
      { status: 500 }
    );
  }
}
