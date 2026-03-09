/**
 * GET /api/compliance/night-work-summary
 *
 * Returns night work statistics per employee for the current calendar month.
 * Used by the compliance dashboard.
 *
 * Auth: ADMIN or MANAGER only
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireRole,
  getOrganizationId,
  successResponse,
  errorResponse,
} from "@/lib/api-utils";
import { getNightWorkStats } from "@/lib/compliance/night-work";
import { estimateBreakImpact } from "@/lib/compliance/break-rules";

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

export async function GET(_request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);
    const countryCode = await getOrgCountryCode(orgId);

    // Current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch all shifts in the current month for this organisation
    const shifts = await prisma.shift.findMany({
      where: {
        roster: { organizationId: orgId },
        startTime: { gte: monthStart, lte: monthEnd },
      },
      select: {
        id: true,
        userId: true,
        startTime: true,
        endTime: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Group shifts by employee
    type EmployeeMeta = {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      employeeNumber: string | null;
    };

    type ShiftRecord = {
      id: string;
      startTime: Date;
      endTime: Date;
    };

    const employeeMap = new Map<
      string,
      { meta: EmployeeMeta; shifts: ShiftRecord[] }
    >();

    for (const shift of shifts) {
      const userId = shift.userId;
      if (!employeeMap.has(userId)) {
        employeeMap.set(userId, {
          meta: shift.user,
          shifts: [],
        });
      }
      employeeMap.get(userId)!.shifts.push({
        id: shift.id,
        startTime: shift.startTime,
        endTime: shift.endTime,
      });
    }

    // Build per-employee stats
    let orgNightShiftTotal = 0;
    let orgNightWorkerCount = 0;
    let orgNightViolationCount = 0;
    let orgShiftsRequiringBreak = 0;

    const employees = Array.from(employeeMap.values()).map(
      ({ meta, shifts: empShifts }) => {
        const nightStats = getNightWorkStats(empShifts, countryCode);
        const breakSummary = estimateBreakImpact(empShifts, countryCode);

        orgNightShiftTotal += nightStats.nightShiftCount;
        if (nightStats.isNightWorker) orgNightWorkerCount++;
        orgNightViolationCount += nightStats.violations.length;
        orgShiftsRequiringBreak += breakSummary.shiftsRequiringBreak;

        return {
          employeeId: meta.id,
          employeeName: `${meta.firstName} ${meta.lastName}`.trim(),
          email: meta.email,
          employeeNumber: meta.employeeNumber,
          totalShifts: empShifts.length,
          nightShiftCount: nightStats.nightShiftCount,
          avgNightHoursPerShift:
            Math.round(nightStats.avgNightHoursPerShift * 100) / 100,
          maxNightHoursInShift:
            Math.round(nightStats.maxNightHours * 100) / 100,
          isNightWorker: nightStats.isNightWorker,
          nightWorkViolations: nightStats.violations.length,
          shiftsRequiringBreak: breakSummary.shiftsRequiringBreak,
          // Break records not yet tracked in schema — always 0%
          breakCompliancePercent: breakSummary.compliancePercent,
        };
      }
    );

    // Sort: night workers with violations first
    employees.sort((a, b) => {
      if (b.nightWorkViolations !== a.nightWorkViolations) {
        return b.nightWorkViolations - a.nightWorkViolations;
      }
      if (b.isNightWorker !== a.isNightWorker) {
        return b.isNightWorker ? 1 : -1;
      }
      return b.nightShiftCount - a.nightShiftCount;
    });

    return successResponse({
      period: {
        from: monthStart.toISOString(),
        to: monthEnd.toISOString(),
      },
      countryCode,
      summary: {
        totalEmployees: employees.length,
        nightWorkerCount: orgNightWorkerCount,
        totalNightShifts: orgNightShiftTotal,
        nightWorkViolations: orgNightViolationCount,
        shiftsRequiringBreak: orgShiftsRequiringBreak,
      },
      employees,
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
    console.error("[compliance/night-work-summary] Error:", error);
    return errorResponse("Failed to generate night work summary", 500);
  }
}
