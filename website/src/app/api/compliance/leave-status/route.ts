import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  requireRole,
  getOrganizationId,
} from "@/lib/api-utils";
import {
  getAnnualLeaveRules,
  calculateEntitlement,
  checkCarryOverCompliance,
  getLeaveUtilization,
  isEntitlementBelowStatutory,
  type AnnualLeaveRules,
  type LeaveUtilization,
} from "@/lib/compliance/annual-leave";

// ─── Response types ──────────────────────────────────────────────────────────

interface EmployeeLeaveStatus {
  id: string;
  name: string;
  statutoryMin: number;
  entitlement: number;
  earned: number;
  used: number;
  remaining: number;
  carryOver: number;
  carryOverExpiry: string | null;
  utilization: LeaveUtilization;
}

interface LeaveAlert {
  type:
    | "below_statutory"
    | "low_utilization"
    | "carryover_expiring"
    | "carryover_exceeded"
    | "exceeded_entitlement";
  employeeId: string;
  message: string;
}

// ─── GET /api/compliance/leave-status ────────────────────────────────────────

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

    const rules = getAnnualLeaveRules(countryCode);

    // Fetch accrual balances for VACATION type in the given year
    const balances = await prisma.accrualBalance.findMany({
      where: {
        type: "VACATION",
        year,
        user: {
          organizationId: orgId,
          isActive: true,
          ...(employeeId ? { id: employeeId } : {}),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hireDate: true,
            dateOfBirth: true,
          },
        },
      },
    });

    const employees: EmployeeLeaveStatus[] = [];
    const alerts: LeaveAlert[] = [];

    for (const balance of balances) {
      const user = balance.user;
      const name = `${user.firstName} ${user.lastName}`;

      // Calculate statutory entitlement with seniority/age bonuses
      const entitlement = calculateEntitlement(
        countryCode,
        user.hireDate,
        user.dateOfBirth
      );

      const earned = Number(balance.earnedDays);
      const used = Number(balance.usedDays);
      const remaining = Number(balance.remainingDays);
      const carryOver = Number(balance.carryOverDays ?? 0);
      const annualEntitlement = Number(balance.annualEntitlement);

      const utilization = getLeaveUtilization(used, earned > 0 ? earned : annualEntitlement);

      const employeeStatus: EmployeeLeaveStatus = {
        id: user.id,
        name,
        statutoryMin: rules.statutoryMinDays,
        entitlement,
        earned,
        used,
        remaining,
        carryOver,
        carryOverExpiry: balance.carryOverExpiry
          ? balance.carryOverExpiry.toISOString().split("T")[0]
          : null,
        utilization,
      };

      employees.push(employeeStatus);

      // Generate alerts

      // Below statutory minimum
      if (isEntitlementBelowStatutory(annualEntitlement, countryCode)) {
        alerts.push({
          type: "below_statutory",
          employeeId: user.id,
          message: `${name}'s entitlement (${annualEntitlement} days) is below the statutory minimum (${rules.statutoryMinDays} days) for ${countryCode}`,
        });
      }

      // Low utilization warning (< 25% with more than 3 months of year elapsed)
      const now = new Date();
      const monthsElapsed = now.getMonth() + 1; // 1-indexed
      if (utilization.status === "low" && monthsElapsed >= 9) {
        alerts.push({
          type: "low_utilization",
          employeeId: user.id,
          message: `${name} has only used ${utilization.percent}% of leave with ${12 - monthsElapsed} month(s) remaining in the year`,
        });
      }

      // Carry-over expiring
      if (carryOver > 0) {
        const carryOverStatus = checkCarryOverCompliance(
          carryOver,
          balance.carryOverExpiry,
          countryCode
        );

        if (carryOverStatus.isExpired && carryOverStatus.daysExpiring > 0) {
          alerts.push({
            type: "carryover_expiring",
            employeeId: user.id,
            message: `${name} has ${carryOverStatus.daysExpiring} carry-over day(s) that have expired`,
          });
        } else if (
          !carryOverStatus.isExpired &&
          carryOverStatus.daysExpiring > 0
        ) {
          const expiryStr = carryOverStatus.expiryDate
            .toISOString()
            .split("T")[0];
          alerts.push({
            type: "carryover_expiring",
            employeeId: user.id,
            message: `${name} has ${carryOverStatus.daysExpiring} carry-over day(s) exceeding the ${rules.carryOverMaxDays}-day limit, expiring ${expiryStr}`,
          });
        }
      }

      // Exceeded entitlement
      if (utilization.status === "exceeded") {
        alerts.push({
          type: "exceeded_entitlement",
          employeeId: user.id,
          message: `${name} has used ${used} days, exceeding their ${earned > 0 ? earned : annualEntitlement}-day entitlement`,
        });
      }
    }

    // Sort employees: alerts first (exceeded > low util > normal), then alphabetically
    employees.sort((a, b) => {
      const statusOrder = { exceeded: 0, low: 1, high: 2, normal: 3 };
      const aOrder = statusOrder[a.utilization.status];
      const bOrder = statusOrder[b.utilization.status];
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });

    return successResponse({
      year,
      countryCode,
      rules: {
        statutoryMinDays: rules.statutoryMinDays,
        commonEntitlement: rules.commonEntitlement,
        accrualMethod: rules.accrualMethod,
        carryOverAllowed: rules.carryOverAllowed,
        carryOverMaxDays: rules.carryOverMaxDays,
        carryOverDeadline: rules.carryOverDeadline,
        legalReference: rules.legalReference,
      } satisfies Partial<AnnualLeaveRules>,
      employees,
      alerts,
      summary: {
        total: employees.length,
        belowStatutory: alerts.filter((a) => a.type === "below_statutory")
          .length,
        lowUtilization: alerts.filter((a) => a.type === "low_utilization")
          .length,
        carryOverIssues: alerts.filter((a) => a.type === "carryover_expiring")
          .length,
        exceeded: alerts.filter((a) => a.type === "exceeded_entitlement")
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
    console.error("Error fetching leave status:", error);
    return errorResponse("Failed to fetch leave status", 500);
  }
}
