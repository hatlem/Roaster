import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole } from "@/lib/api-utils";
import { addHours, differenceInHours, startOfWeek, endOfWeek } from "date-fns";

interface ComplianceViolation {
  type: "REST_PERIOD" | "DAILY_HOURS" | "WEEKLY_HOURS" | "OVERTIME" | "14_DAY_RULE";
  severity: "ERROR" | "WARNING";
  message: string;
  shiftId?: string;
  userId?: string;
}

// POST /api/compliance/validate - Validate roster compliance
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const body = await request.json();
    const { rosterId } = body;

    if (!rosterId) {
      return errorResponse("Missing roster ID");
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

    if (!roster) {
      return errorResponse("Roster not found", 404);
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
            message: `Shift exceeds daily limit of ${org.maxDailyHours} hours (${shiftHours.toFixed(1)}h)`,
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
              message: `Insufficient rest period: ${restHours}h (minimum ${org.minDailyRest}h required)`,
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
            message: `Weekly hours exceed limit of ${org.maxWeeklyHours}h (${hours.toFixed(1)}h scheduled)`,
            userId,
          });
        }
      }
    }

    // Check 14-day publishing rule
    const now = new Date();
    const daysUntilStart = differenceInHours(new Date(roster.startDate), now) / 24;

    if (roster.status === "DRAFT" && daysUntilStart < org.publishDeadline) {
      violations.push({
        type: "14_DAY_RULE",
        severity: "WARNING",
        message: `Roster should be published ${org.publishDeadline} days before start date (${Math.floor(daysUntilStart)} days remaining)`,
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
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }
    console.error("Error validating compliance:", error);
    return errorResponse("Failed to validate compliance", 500);
  }
}
