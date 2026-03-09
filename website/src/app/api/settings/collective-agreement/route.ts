import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole, getOrganizationId } from "@/lib/api-utils";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// GET /api/settings/collective-agreement - Fetch current org's collective agreement (or null)
export async function GET() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const agreement = await prisma.collectiveAgreement.findUnique({
      where: { organizationId: orgId },
    });

    return successResponse(agreement);
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
    console.error("Error fetching collective agreement:", error);
    return errorResponse("Failed to fetch collective agreement", 500);
  }
}

// PUT /api/settings/collective-agreement - Create or update collective agreement
export async function PUT(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN"]);
    const orgId = await getOrganizationId(session.user.id);

    const body = await request.json();
    const {
      name,
      countryCode,
      sector,
      unionCode,
      maxDailyHours,
      maxWeeklyHours,
      overtimeWeeklyMax,
      overtimeYearlyMax,
      minDailyRest,
      minWeeklyRest,
      publishDeadlineOverride,
      overtimePremiumOverride,
      nightWorkAllowed,
      nightWorkMaxHoursPerShift,
      nightWorkRequiresConsent,
      sundayPremiumAllowed,
      sundayPremiumRate,
      holidayPremiumRate,
      breakAllowance,
      effectiveFrom,
      effectiveTo,
      notes,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return errorResponse("Agreement name is required");
    }
    if (!countryCode || typeof countryCode !== "string") {
      return errorResponse("Country code is required");
    }

    const toOptionalInt = (val: unknown): number | null => {
      if (val === null || val === undefined || val === "") return null;
      const n = Number(val);
      return isNaN(n) ? null : Math.round(n);
    };

    const toOptionalDecimal = (val: unknown): number | null => {
      if (val === null || val === undefined || val === "") return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    const data = {
      name: name.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      sector: sector?.trim() || null,
      unionCode: unionCode?.trim() || null,
      maxDailyHours: toOptionalInt(maxDailyHours),
      maxWeeklyHours: toOptionalInt(maxWeeklyHours),
      overtimeWeeklyMax: toOptionalInt(overtimeWeeklyMax),
      overtimeYearlyMax: toOptionalInt(overtimeYearlyMax),
      minDailyRest: toOptionalInt(minDailyRest),
      minWeeklyRest: toOptionalInt(minWeeklyRest),
      publishDeadlineOverride: toOptionalInt(publishDeadlineOverride),
      overtimePremiumOverride: toOptionalDecimal(overtimePremiumOverride),
      nightWorkAllowed: nightWorkAllowed !== false,
      nightWorkMaxHoursPerShift: toOptionalInt(nightWorkMaxHoursPerShift),
      nightWorkRequiresConsent: nightWorkRequiresConsent === true,
      sundayPremiumAllowed: sundayPremiumAllowed !== false,
      sundayPremiumRate: toOptionalDecimal(sundayPremiumRate),
      holidayPremiumRate: toOptionalDecimal(holidayPremiumRate),
      breakAllowance: toOptionalInt(breakAllowance),
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      notes: notes?.trim() || null,
    };

    const agreement = await prisma.collectiveAgreement.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, ...data },
      update: data,
    });

    return successResponse(agreement);
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
    console.error("Error saving collective agreement:", error);
    return errorResponse("Failed to save collective agreement", 500);
  }
}

// DELETE /api/settings/collective-agreement - Remove collective agreement (revert to statutory defaults)
export async function DELETE() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN"]);
    const orgId = await getOrganizationId(session.user.id);

    const existing = await prisma.collectiveAgreement.findUnique({
      where: { organizationId: orgId },
    });

    if (!existing) {
      return errorResponse("No collective agreement configured", 404);
    }

    await prisma.collectiveAgreement.delete({
      where: { organizationId: orgId },
    });

    return successResponse({ removed: true });
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
    console.error("Error removing collective agreement:", error);
    return errorResponse("Failed to remove collective agreement", 500);
  }
}
