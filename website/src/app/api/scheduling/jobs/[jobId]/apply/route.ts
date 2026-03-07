import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { applyAutoSchedule } from "@/services/autoSchedulerService";
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

    await applyAutoSchedule(jobId, session.user.id);

    return NextResponse.json({
      success: true,
      message: dict.api.scheduling.scheduleAppliedSuccess,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: dict.api.common.unauthorized }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: dict.api.common.forbidden }, { status: 403 });
    }
    console.error("Apply schedule error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : dict.api.scheduling.failedApplySchedule },
      { status: 500 }
    );
  }
}
