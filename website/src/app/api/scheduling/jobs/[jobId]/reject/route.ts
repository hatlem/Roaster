import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { rejectAutoSchedule } from "@/services/autoSchedulerService";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);

    const { jobId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: dict.api.scheduling.rejectionReasonRequired },
        { status: 400 }
      );
    }

    await rejectAutoSchedule(jobId, session.user.id, reason);

    return NextResponse.json({
      success: true,
      message: dict.api.scheduling.scheduleRejected,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: dict.api.common.unauthorized }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: dict.api.common.forbidden }, { status: 403 });
    }
    console.error("Reject schedule error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : dict.api.scheduling.failedRejectSchedule },
      { status: 500 }
    );
  }
}
