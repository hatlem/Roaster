import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole, getOrganizationId } from "@/lib/api-utils";
import { addHours, differenceInHours, startOfWeek, endOfWeek } from "date-fns";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getOvertimeTiers,
  calculateOvertimeHours,
  checkOvertimeTiers,
} from "@/lib/compliance/overtime-tiers";

interface ComplianceViolation {
  type: "REST_PERIOD" | "DAILY_HOURS" | "WEEKLY_HOURS" | "OVERTIME" | "14_DAY_RULE" | "OVERTIME_TIER";
  severity: "ERROR" | "WARNING";
  message: string;
  shiftId?: string;
  userId?: string;
}

// POST /api/compliance/validate - Validate roster compliance
export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const body = await request.json();
    const { rosterId } = body;

    if (!rosterId) {
      return errorResponse(dict.api.compliance.missingRosterId);
    }

    // Get roster with all shifts
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        shifts: {
          include: {
            user: true,
          },
          orderBy: { startTime: "asc" },
        },
        organization: true,
      },
    });

    if (!roster || roster.organizationId !== orgId) {
      return errorResponse(dict.api.compliance.rosterNotFound, 404);
    }

    const violations: ComplianceViolation[] = [];
    const org = roster.organization;

    // Group shifts by user
    const shiftsByUser = new Map<string, typeof roster.shifts>();
    for (const shift of roster.shifts) {
      const userShifts = shiftsByUser.get(shift.userId) || [];
      userShifts.push(shift);
      shiftsByUser.set(shift.userId, userShifts);
    }

    // Validate each user's shifts
    for (const [userId, shifts] of shiftsByUser) {
      const sortedShifts = shifts.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      for (let i = 0; i < sortedShifts.length; i++) {
        const shift = sortedShifts[i];
        const shiftHours = differenceInHours(
          new Date(shift.endTime),
          new Date(shift.startTime)
        ) - (shift.breakMinutes / 60);

        // Check daily hours limit (default 9 hours)
        if (shiftHours > org.maxDailyHours) {
          violations.push({
            type: "DAILY_HOURS",
            severity: "ERROR",
            message: dict.api.compliance.shiftExceedsDailyLimit.replace('{maxHours}', String(org.maxDailyHours)).replace('{actual}', shiftHours.toFixed(1)),
            shiftId: shift.id,
            userId,
          });
        }

        // Check rest period between shifts (default 11 hours)
        if (i > 0) {
          const prevShift = sortedShifts[i - 1];
          const restHours = differenceInHours(
            new Date(shift.startTime),
            new Date(prevShift.endTime)
          );

          if (restHours < org.minDailyRest) {
            violations.push({
              type: "REST_PERIOD",
              severity: "ERROR",
              message: dict.api.compliance.insufficientRestPeriod.replace('{actual}', String(restHours)).replace('{minimum}', String(org.minDailyRest)),
              shiftId: shift.id,
              userId,
            });
          }
        }
      }

      // Check weekly hours limit (default 40 hours)
      const weeklyHoursMap = new Map<string, number>();
      for (const shift of sortedShifts) {
        const weekStart = startOfWeek(new Date(shift.startTime), { weekStartsOn: 1 });
        const weekKey = weekStart.toISOString();
        const shiftHours = differenceInHours(
          new Date(shift.endTime),
          new Date(shift.startTime)
        ) - (shift.breakMinutes / 60);

        weeklyHoursMap.set(weekKey, (weeklyHoursMap.get(weekKey) || 0) + shiftHours);
      }

      for (const [weekKey, hours] of weeklyHoursMap) {
        if (hours > org.maxWeeklyHours) {
          violations.push({
            type: "WEEKLY_HOURS",
            severity: "ERROR",
            message: dict.api.compliance.weeklyHoursExceedLimit.replace('{maxHours}', String(org.maxWeeklyHours)).replace('{actual}', hours.toFixed(1)),
            userId,
          });
        }
      }

      // Check multi-period overtime tiers per country
      const countryCode = "NO"; // Organization model does not have countryCode; default to NO
      const tiers = getOvertimeTiers(countryCode);

      // Fetch all shifts for this user in the current year for accurate yearly/rolling accumulation
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const allYearShifts = await prisma.shift.findMany({
        where: {
          userId,
          roster: { organizationId: orgId },
          startTime: { gte: yearStart },
        },
        select: {
          id: true,
          userId: true,
          startTime: true,
          endTime: true,
          breakMinutes: true,
        },
      });

      const accumulation = calculateOvertimeHours(allYearShifts, userId, org.maxWeeklyHours);
      const tierViolations = checkOvertimeTiers(accumulation, tiers, countryCode);

      for (const v of tierViolations) {
        violations.push({
          type: "OVERTIME_TIER",
          severity: v.severity,
          message: `${v.tier} overtime limit: ${v.current.toFixed(1)}h used of ${v.limit}h allowed`,
          userId,
        });
      }
    }

    // Check 14-day publishing rule
    const now = new Date();
    const daysUntilStart = differenceInHours(new Date(roster.startDate), now) / 24;

    if (roster.status === "DRAFT" && daysUntilStart < org.publishDeadline) {
      violations.push({
        type: "14_DAY_RULE",
        severity: "WARNING",
        message: dict.api.compliance.rosterPublishDeadline.replace('{days}', String(org.publishDeadline)).replace('{remaining}', String(Math.floor(daysUntilStart))),
      });
    }

    // Update shift compliance flags
    const shiftUpdates = violations
      .filter(v => v.shiftId)
      .reduce((acc, v) => {
        if (!acc[v.shiftId!]) {
          acc[v.shiftId!] = {
            violatesRestPeriod: false,
            violatesDailyLimit: false,
            violatesWeeklyLimit: false,
          };
        }
        if (v.type === "REST_PERIOD") acc[v.shiftId!].violatesRestPeriod = true;
        if (v.type === "DAILY_HOURS") acc[v.shiftId!].violatesDailyLimit = true;
        if (v.type === "WEEKLY_HOURS") acc[v.shiftId!].violatesWeeklyLimit = true;
        return acc;
      }, {} as Record<string, { violatesRestPeriod: boolean; violatesDailyLimit: boolean; violatesWeeklyLimit: boolean }>);

    // Update shifts in database
    for (const [shiftId, flags] of Object.entries(shiftUpdates)) {
      await prisma.shift.update({
        where: { id: shiftId },
        data: flags,
      });
    }

    const isCompliant = violations.filter(v => v.severity === "ERROR").length === 0;

    return successResponse({
      rosterId,
      isCompliant,
      violations,
      summary: {
        totalViolations: violations.length,
        errors: violations.filter(v => v.severity === "ERROR").length,
        warnings: violations.filter(v => v.severity === "WARNING").length,
      },
    });
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
    console.error("Error validating compliance:", error);
    return errorResponse(dict.api.compliance.failedValidateCompliance, 500);
  }
}
