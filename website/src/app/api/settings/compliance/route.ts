import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole, getOrganizationId } from "@/lib/api-utils";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// PUT /api/settings/compliance - Update compliance settings
export async function PUT(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN"]);
    const orgId = await getOrganizationId(session.user.id);

    const body = await request.json();
    const {
      maxDailyHours,
      maxWeeklyHours,
      minDailyRest,
      minWeeklyRest,
      publishDeadline,
      overtimePremium,
    } = body;

    // Validate all fields are numbers
    const fields = { maxDailyHours, maxWeeklyHours, minDailyRest, minWeeklyRest, publishDeadline, overtimePremium };
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null || typeof value !== "number" || isNaN(value)) {
        return errorResponse(dict.api.settings.compliance.invalidNumber.replace("{field}", key));
      }
    }

    // Validate reasonable ranges
    if (maxDailyHours <= 0 || maxDailyHours > 24) {
      return errorResponse(dict.api.settings.compliance.maxDailyHoursRange);
    }

    if (maxWeeklyHours <= 0 || maxWeeklyHours > 168) {
      return errorResponse(dict.api.settings.compliance.maxWeeklyHoursRange);
    }

    if (minDailyRest < 0 || minDailyRest > 24) {
      return errorResponse(dict.api.settings.compliance.minDailyRestRange);
    }

    if (minWeeklyRest < 0 || minWeeklyRest > 168) {
      return errorResponse(dict.api.settings.compliance.minWeeklyRestRange);
    }

    if (publishDeadline < 0 || publishDeadline > 365) {
      return errorResponse(dict.api.settings.compliance.publishDeadlineRange);
    }

    if (overtimePremium < 0 || overtimePremium > 300) {
      return errorResponse(dict.api.settings.compliance.overtimePremiumRange);
    }

    // Convert overtime premium from percentage to decimal multiplier
    // e.g., 40% -> 1.40
    const overtimeDecimal = 1 + overtimePremium / 100;

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        maxDailyHours: Math.round(maxDailyHours),
        maxWeeklyHours: Math.round(maxWeeklyHours),
        minDailyRest: Math.round(minDailyRest),
        minWeeklyRest: Math.round(minWeeklyRest),
        publishDeadline: Math.round(publishDeadline),
        overtimePremium: overtimeDecimal,
      },
      select: {
        id: true,
        maxDailyHours: true,
        maxWeeklyHours: true,
        minDailyRest: true,
        minWeeklyRest: true,
        publishDeadline: true,
        overtimePremium: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse(dict.api.common.unauthorized, 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse(dict.api.common.forbidden, 403);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse(dict.api.common.noOrganization, 400);
    }
    console.error("Error updating compliance settings:", error);
    return errorResponse(dict.api.settings.compliance.failedUpdate, 500);
  }
}
