import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole, getOrganizationId } from "@/lib/api-utils";
import {
  getOvertimeTiers,
  calculateOvertimeHours,
  checkOvertimeTiers,
  getOvertimeUtilization,
  type OvertimeAccumulation,
  type OvertimeTierViolation,
  type OvertimeTierUtilization,
} from "@/lib/compliance/overtime-tiers";

interface EmployeeTierStatus {
  userId: string;
  name: string;
  department: string | null;
  accumulation: OvertimeAccumulation;
  utilization: OvertimeTierUtilization;
  violations: OvertimeTierViolation[];
  overallStatus: "ok" | "warning" | "error";
}

// GET /api/compliance/overtime-tiers?employeeId=...&year=2026
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId") ?? undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      return errorResponse("Invalid year parameter", 400);
    }

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    // Resolve country code — Organisation model has no countryCode field, default to NO
    const countryCode = "NO";
    const tiers = getOvertimeTiers(countryCode);

    // Fetch org settings for maxWeeklyHours
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { maxWeeklyHours: true },
    });
    const maxWeeklyHours = org?.maxWeeklyHours ?? 40;

    // Fetch shifts for the org within the requested year
    const shifts = await prisma.shift.findMany({
      where: {
        roster: { organizationId: orgId },
        startTime: { gte: yearStart, lt: yearEnd },
        ...(employeeId ? { userId: employeeId } : {}),
      },
      select: {
        id: true,
        userId: true,
        startTime: true,
        endTime: true,
        breakMinutes: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Collect unique user IDs from shifts
    const userMap = new Map<
      string,
      { firstName: string; lastName: string; department: string | null }
    >();
    for (const s of shifts) {
      if (!userMap.has(s.userId)) {
        userMap.set(s.userId, {
          firstName: s.user.firstName,
          lastName: s.user.lastName,
          department: s.user.department,
        });
      }
    }

    // Strip user join from shifts before passing to calculation functions
    const plainShifts = shifts.map((s) => ({
      id: s.id,
      userId: s.userId,
      startTime: s.startTime,
      endTime: s.endTime,
      breakMinutes: s.breakMinutes,
    }));

    const results: EmployeeTierStatus[] = [];

    for (const [userId, userInfo] of userMap) {
      const accumulation = calculateOvertimeHours(plainShifts, userId, maxWeeklyHours);
      const utilization = getOvertimeUtilization(accumulation, tiers);
      const violations = checkOvertimeTiers(accumulation, tiers, countryCode);

      const hasError = violations.some((v) => v.severity === "ERROR");
      const hasWarning = violations.some((v) => v.severity === "WARNING");

      results.push({
        userId,
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        department: userInfo.department,
        accumulation,
        utilization,
        violations,
        overallStatus: hasError ? "error" : hasWarning ? "warning" : "ok",
      });
    }

    // Sort: errors first, then warnings, then ok; alphabetically within each group
    results.sort((a, b) => {
      const order = { error: 0, warning: 1, ok: 2 };
      const statusDiff = order[a.overallStatus] - order[b.overallStatus];
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });

    return successResponse({
      year,
      countryCode,
      tiers,
      employees: results,
      summary: {
        total: results.length,
        errors: results.filter((r) => r.overallStatus === "error").length,
        warnings: results.filter((r) => r.overallStatus === "warning").length,
        ok: results.filter((r) => r.overallStatus === "ok").length,
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
      return errorResponse("No organization found", 400);
    }
    console.error("Error fetching overtime tier data:", error);
    return errorResponse("Failed to fetch overtime tier data", 500);
  }
}
