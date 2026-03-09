/**
 * GET /api/compliance/holidays
 *
 * Returns public holidays and Sunday work rules for a given country/year.
 *
 * Query params:
 *   country  — ISO country code (e.g. NO, DE, FR). Defaults to org's country.
 *   year     — Calendar year (e.g. 2026). Defaults to current year.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireRole,
  getOrganizationId,
  successResponse,
  errorResponse,
} from "@/lib/api-utils";
import {
  getPublicHolidays,
  getSundayRules,
  getUpcomingHolidays,
  SUPPORTED_COUNTRIES,
} from "@/lib/compliance/holidays";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive a country code from the organisation's primary location, or 'NO'. */
async function getOrgCountryCode(orgId: string): Promise<string> {
  const location = await prisma.location.findFirst({
    where: { organizationId: orgId, isActive: true },
    select: { country: true },
    orderBy: { createdAt: "asc" },
  });
  return location?.country ?? "NO";
}

/**
 * Attempt to load holiday overrides from the PublicHoliday model.
 * Returns null if the model doesn't exist yet (another agent is adding it).
 */
async function loadDbHolidayOverrides(
  countryCode: string,
  year: number
): Promise<Array<{ name: string; nameLocal: string; date: Date; isMoveable: boolean }> | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;
    if (!db.publicHoliday) return null;

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const records = await db.publicHoliday.findMany({
      where: {
        countryCode: countryCode.toUpperCase(),
        date: { gte: startOfYear, lte: endOfYear },
      },
      orderBy: { date: "asc" },
    });

    if (!records || records.length === 0) return null;

    return records.map((r: { name: string; nameLocal?: string; date: Date; isMoveable?: boolean }) => ({
      name: r.name,
      nameLocal: r.nameLocal ?? r.name,
      date: new Date(r.date),
      isMoveable: r.isMoveable ?? false,
    }));
  } catch {
    // Model doesn't exist yet — fall back to static data
    return null;
  }
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const { searchParams } = new URL(request.url);
    const countryParam = searchParams.get("country");
    const yearParam = searchParams.get("year");

    // Resolve country
    const countryCode = countryParam
      ? countryParam.toUpperCase()
      : await getOrgCountryCode(orgId);

    // Resolve year
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > 2100) {
      return errorResponse("Invalid year parameter", 400);
    }

    // Check if country is supported
    if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
      return errorResponse(
        `Unsupported country code: ${countryCode}. Supported: ${SUPPORTED_COUNTRIES.join(", ")}`,
        400
      );
    }

    // Try DB overrides first, then fall back to static data
    const dbHolidays = await loadDbHolidayOverrides(countryCode, year);
    const holidays = dbHolidays ?? getPublicHolidays(countryCode, year);

    // Sunday rules
    const sundayRules = getSundayRules(countryCode);

    // Upcoming holidays (next 5 from today)
    const upcoming = getUpcomingHolidays(countryCode, new Date(), 5);

    return successResponse({
      countryCode,
      year,
      holidays: holidays.map((h) => ({
        name: h.name,
        nameLocal: h.nameLocal,
        date: h.date instanceof Date ? h.date.toISOString().split("T")[0] : h.date,
        isMoveable: h.isMoveable,
      })),
      sundayRules,
      upcoming: upcoming.map((h) => ({
        name: h.name,
        nameLocal: h.nameLocal,
        date: h.date.toISOString().split("T")[0],
        isMoveable: h.isMoveable,
      })),
      source: dbHolidays ? "database" : "static",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse("No organisation found", 400);
    }
    console.error("[compliance/holidays] Error:", error);
    return errorResponse("Failed to fetch holiday data", 500);
  }
}
