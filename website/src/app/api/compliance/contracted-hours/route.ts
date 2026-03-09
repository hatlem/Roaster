import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  requireRole,
  getOrganizationId,
} from "@/lib/api-utils";
import {
  getContractedHoursRules,
  validateContractedHours,
  checkScheduleVsContract,
  type ContractViolation,
  type ScheduleContractStatus,
  type ContractedHoursRules,
} from "@/lib/compliance/contracted-hours";

// ─── Response types ──────────────────────────────────────────────────────────

interface EmployeeContractStatus {
  id: string;
  name: string;
  department: string | null;
  employmentType: string;
  contractedHours: number | null;
  scheduledHoursThisWeek: number;
  scheduleStatus: ScheduleContractStatus;
  violations: ContractViolation[];
  overallStatus: "ok" | "warning" | "error";
}

// ─── GET /api/compliance/contracted-hours ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId") ?? undefined;

    // Resolve country code from collective agreement or default to NO
    let countryCode = "NO";
    try {
      const cba = await prisma.collectiveAgreement.findUnique({
        where: { organizationId: orgId },
        select: { countryCode: true },
      });
      if (cba?.countryCode) {
        countryCode = cba.countryCode;
      }
    } catch {
      // No CBA — use default
    }

    const rules = getContractedHoursRules(countryCode);

    // Calculate current week boundaries (Monday–Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Fetch employees — try to include contractedHours (may not exist yet)
    let employees;
    try {
      employees = await prisma.user.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          ...(employeeId ? { id: employeeId } : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: true,
          employmentType: true,
          contractedHours: true,
        },
      });
    } catch {
      // contractedHours field may not exist yet — fetch without it
      employees = (
        await prisma.user.findMany({
          where: {
            organizationId: orgId,
            isActive: true,
            ...(employeeId ? { id: employeeId } : {}),
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            employmentType: true,
          },
        })
      ).map((e) => ({ ...e, contractedHours: null as unknown }));
    }

    // Fetch shifts for the current week
    const shifts = await prisma.shift.findMany({
      where: {
        roster: { organizationId: orgId },
        startTime: { gte: weekStart, lt: weekEnd },
        isCancelled: false,
        ...(employeeId ? { userId: employeeId } : {}),
      },
      select: {
        userId: true,
        startTime: true,
        endTime: true,
        breakMinutes: true,
      },
    });

    // Calculate scheduled hours per employee this week
    const scheduledHoursMap = new Map<string, number>();
    for (const shift of shifts) {
      const durationMs =
        new Date(shift.endTime).getTime() -
        new Date(shift.startTime).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      const netHours = durationHours - shift.breakMinutes / 60;
      const current = scheduledHoursMap.get(shift.userId) ?? 0;
      scheduledHoursMap.set(shift.userId, current + Math.max(0, netHours));
    }

    // Build per-employee status
    const results: EmployeeContractStatus[] = [];

    for (const emp of employees) {
      const name = `${emp.firstName} ${emp.lastName}`;
      const contractedHrs =
        emp.contractedHours !== null && emp.contractedHours !== undefined
          ? Number(emp.contractedHours)
          : null;
      const scheduledHrs = Math.round(
        (scheduledHoursMap.get(emp.id) ?? 0) * 100
      ) / 100;

      // Validate contracted hours against country rules
      const violations = validateContractedHours(
        contractedHrs,
        emp.employmentType,
        countryCode
      );

      // Check schedule vs contract
      const scheduleStatus = checkScheduleVsContract(
        scheduledHrs,
        contractedHrs
      );

      const hasError = violations.some((v) => v.severity === "ERROR");
      const hasWarning =
        violations.some((v) => v.severity === "WARNING") ||
        scheduleStatus.underScheduled;

      results.push({
        id: emp.id,
        name,
        department: emp.department,
        employmentType: emp.employmentType,
        contractedHours: contractedHrs,
        scheduledHoursThisWeek: scheduledHrs,
        scheduleStatus,
        violations,
        overallStatus: hasError ? "error" : hasWarning ? "warning" : "ok",
      });
    }

    // Sort: errors first, then warnings, then ok; alphabetically within
    results.sort((a, b) => {
      const order = { error: 0, warning: 1, ok: 2 };
      const statusDiff = order[a.overallStatus] - order[b.overallStatus];
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });

    return successResponse({
      countryCode,
      rules: {
        zeroHoursAllowed: rules.zeroHoursAllowed,
        minGuaranteedHours: rules.minGuaranteedHours,
        maxWeeklySchedule: rules.maxWeeklySchedule,
        bandedHoursRight: rules.bandedHoursRight,
        legalReference: rules.legalReference,
      } satisfies ContractedHoursRules,
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
      employees: results,
      summary: {
        total: results.length,
        errors: results.filter((r) => r.overallStatus === "error").length,
        warnings: results.filter((r) => r.overallStatus === "warning").length,
        ok: results.filter((r) => r.overallStatus === "ok").length,
        zeroHoursViolations: results.filter((r) =>
          r.violations.some((v) => v.type === "ZERO_HOURS_NOT_ALLOWED")
        ).length,
        underScheduled: results.filter((r) => r.scheduleStatus.underScheduled)
          .length,
        overScheduled: results.filter((r) => r.scheduleStatus.overScheduled)
          .length,
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
    console.error("Error fetching contracted hours data:", error);
    return errorResponse("Failed to fetch contracted hours data", 500);
  }
}
