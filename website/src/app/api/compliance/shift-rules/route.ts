/**
 * GET /api/compliance/shift-rules
 *
 * Returns per-shift night work and mandatory break analysis.
 *
 * Query params:
 *   rosterId  — analyse all shifts in this roster
 *   employeeId + from + to (ISO) — analyse shifts for a specific employee
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
  calculateNightHours,
  checkNightWorkLimit,
  getNightWorkStats,
} from "@/lib/compliance/night-work";
import {
  requiresBreak,
  getRequiredBreakMinutes,
  checkBreakCompliance,
} from "@/lib/compliance/break-rules";

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

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);
    const countryCode = await getOrgCountryCode(orgId);

    const { searchParams } = new URL(request.url);
    const rosterId = searchParams.get("rosterId");
    const employeeId = searchParams.get("employeeId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // ── Fetch shifts ─────────────────────────────────────────────────────────

    type ShiftWithUser = {
      id: string;
      startTime: Date;
      endTime: Date;
      breakMinutes: number;
      userId: string;
      user: { firstName: string; lastName: string };
      roster: { organizationId: string };
    };

    let shifts: ShiftWithUser[];

    if (rosterId) {
      const roster = await prisma.roster.findUnique({
        where: { id: rosterId },
        select: { organizationId: true },
      });

      if (!roster || roster.organizationId !== orgId) {
        return errorResponse("Roster not found", 404);
      }

      shifts = await prisma.shift.findMany({
        where: { rosterId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          roster: { select: { organizationId: true } },
        },
        orderBy: { startTime: "asc" },
      });
    } else if (employeeId) {
      if (!fromParam || !toParam) {
        return errorResponse("from and to are required when using employeeId");
      }

      const from = new Date(fromParam);
      const to = new Date(toParam);

      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return errorResponse("Invalid from or to date");
      }

      // Verify the employee belongs to this org
      const employee = await prisma.user.findFirst({
        where: { id: employeeId, organizationId: orgId },
        select: { id: true },
      });

      if (!employee) {
        return errorResponse("Employee not found", 404);
      }

      shifts = await prisma.shift.findMany({
        where: {
          userId: employeeId,
          roster: { organizationId: orgId },
          startTime: { gte: from, lte: to },
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
          roster: { select: { organizationId: true } },
        },
        orderBy: { startTime: "asc" },
      });
    } else {
      return errorResponse("Provide rosterId or employeeId + from + to");
    }

    // ── Night work violations (per employee across all their shifts) ──────────

    // Group shifts by user for night worker detection
    const shiftsByUser = new Map<string, typeof shifts>();
    for (const shift of shifts) {
      const userShifts = shiftsByUser.get(shift.userId) ?? [];
      userShifts.push(shift);
      shiftsByUser.set(shift.userId, userShifts);
    }

    // Pre-compute violations per user
    const violationsByUser = new Map<
      string,
      ReturnType<typeof checkNightWorkLimit>
    >();
    for (const [userId, userShifts] of shiftsByUser.entries()) {
      violationsByUser.set(
        userId,
        checkNightWorkLimit(userShifts, countryCode)
      );
    }

    // ── Build per-shift result ────────────────────────────────────────────────

    let totalNightShiftCount = 0;
    let totalShiftsRequiringBreak = 0;
    let totalNightWorkViolations = 0;
    let totalBreakViolations = 0;

    const shiftResults = shifts.map((shift) => {
      const durationHours =
        (new Date(shift.endTime).getTime() -
          new Date(shift.startTime).getTime()) /
        (1000 * 60 * 60);

      const nightHours = calculateNightHours(shift, countryCode);
      const isNightShift = nightHours > 0;

      // Break analysis — no break data in schema yet, so passes empty array
      const breakViolation = checkBreakCompliance(shift, [], countryCode);
      const shiftRequiresBreak = requiresBreak(durationHours, countryCode);
      const requiredBreakMinutes = getRequiredBreakMinutes(
        durationHours,
        countryCode
      );

      // Night work violations for this shift's user
      const userNightViolations = violationsByUser.get(shift.userId) ?? [];
      const nightViolationMessages = userNightViolations.map((v) => v.message);

      // Compile violation strings
      const violations: string[] = [...nightViolationMessages];
      if (breakViolation) {
        violations.push(breakViolation.message);
      }

      // Counters
      if (isNightShift) totalNightShiftCount++;
      if (shiftRequiresBreak) totalShiftsRequiringBreak++;
      if (userNightViolations.length > 0) totalNightWorkViolations++;
      if (
        breakViolation &&
        breakViolation.type === "INSUFFICIENT_BREAK"
      ) {
        totalBreakViolations++;
      }

      return {
        id: shift.id,
        employeeName: `${shift.user.firstName} ${shift.user.lastName}`.trim(),
        startTime: shift.startTime.toISOString(),
        endTime: shift.endTime.toISOString(),
        durationHours: Math.round(durationHours * 100) / 100,
        nightHours: Math.round(nightHours * 100) / 100,
        isNightShift,
        requiresBreak: shiftRequiresBreak,
        requiredBreakMinutes,
        violations,
      };
    });

    return successResponse({
      countryCode,
      shifts: shiftResults,
      summary: {
        nightShiftCount: totalNightShiftCount,
        shiftsRequiringBreak: totalShiftsRequiringBreak,
        nightWorkViolations: totalNightWorkViolations,
        breakViolations: totalBreakViolations,
      },
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
    console.error("[compliance/shift-rules] Error:", error);
    return errorResponse("Failed to analyse shift rules", 500);
  }
}
