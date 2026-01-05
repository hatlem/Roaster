import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyAutoSchedule } from "@/services/autoSchedulerService";

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

    await applyAutoSchedule(jobId, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Schedule applied successfully",
    });
  } catch (error) {
    console.error("Apply schedule error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply schedule" },
      { status: 500 }
    );
  }
}
