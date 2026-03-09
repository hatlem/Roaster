import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  requireAuth,
  requireRole,
  getOrganizationId,
} from "@/lib/api-utils";
import {
  getTOILConfig,
  calculateTOILEarned,
  buildTOILSummary,
} from "@/lib/compliance/toil";

// ─── GET /api/compliance/toil ────────────────────────────────────────────────
// Get TOIL balance for current user or specific employee.
// ADMIN/MANAGER can query any employee; others can only query themselves.
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const orgId = await getOrganizationId(session.user.id);

    const { searchParams } = new URL(request.url);
    const requestedEmployeeId = searchParams.get("employeeId");

    // Determine the target user
    let targetUserId = session.user.id;
    if (requestedEmployeeId) {
      if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
        return errorResponse("Forbidden: cannot query other employees", 403);
      }
      targetUserId = requestedEmployeeId;
    }

    // Verify user belongs to same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { organizationId: true },
    });

    if (!targetUser || targetUser.organizationId !== orgId) {
      return errorResponse("Employee not found", 404);
    }

    // Resolve country code from collective agreement or default to NO
    const countryCode = await resolveCountryCode(orgId);
    const config = getTOILConfig(countryCode);

    // Try to read from TOILBalance model first (may not exist yet)
    let toilData: { earned: number; used: number; expired: number; earliestDate: Date | null } | null = null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = prisma as any;
      if (db.tOILBalance) {
        const balance = await db.tOILBalance.findFirst({
          where: {
            userId: targetUserId,
            year: new Date().getFullYear(),
          },
        });

        if (balance) {
          toilData = {
            earned: Number(balance.earnedHours ?? 0),
            used: Number(balance.usedHours ?? 0),
            expired: Number(balance.expiredHours ?? 0),
            earliestDate: balance.earliestUnusedDate ?? null,
          };
        }
      }
    } catch {
      // TOILBalance model doesn't exist yet — fall through to fallback
    }

    // Fallback: calculate from overtime shifts this year
    if (!toilData) {
      toilData = await calculateFromShifts(targetUserId, orgId, config);
    }

    const summary = buildTOILSummary(
      toilData.earned,
      toilData.used,
      toilData.expired,
      config,
      toilData.earliestDate
    );

    return successResponse({
      userId: targetUserId,
      countryCode,
      config: {
        enabled: config.enabled,
        expiryMonths: config.expiryMonths,
        maxAccumulation: config.maxAccumulation,
        conversionRate: config.conversionRate,
      },
      ...summary,
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
    console.error("Error fetching TOIL balance:", error);
    return errorResponse("Failed to fetch TOIL balance", 500);
  }
}

// ─── POST /api/compliance/toil ───────────────────────────────────────────────
// Request TOIL usage (take time off against TOIL balance).
// Any logged-in user can request for themselves.
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const orgId = await getOrganizationId(session.user.id);
    const userId = session.user.id;

    const body = await request.json();
    const { hours, date, notes } = body as {
      hours?: number;
      date?: string;
      notes?: string;
    };

    if (!hours || hours <= 0) {
      return errorResponse("Hours must be a positive number");
    }

    if (!date) {
      return errorResponse("Date is required");
    }

    const requestDate = new Date(date);
    if (isNaN(requestDate.getTime())) {
      return errorResponse("Invalid date format");
    }

    // Get current balance
    const countryCode = await resolveCountryCode(orgId);
    const config = getTOILConfig(countryCode);

    if (!config.enabled) {
      return errorResponse("TOIL is not enabled for your country");
    }

    // Calculate current balance
    let toilData: { earned: number; used: number; expired: number; earliestDate: Date | null } | null = null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = prisma as any;
      if (db.tOILBalance) {
        const balance = await db.tOILBalance.findFirst({
          where: {
            userId,
            year: new Date().getFullYear(),
          },
        });

        if (balance) {
          toilData = {
            earned: Number(balance.earnedHours ?? 0),
            used: Number(balance.usedHours ?? 0),
            expired: Number(balance.expiredHours ?? 0),
            earliestDate: balance.earliestUnusedDate ?? null,
          };
        }
      }
    } catch {
      // Model doesn't exist yet
    }

    if (!toilData) {
      toilData = await calculateFromShifts(userId, orgId, config);
    }

    const currentBalance = toilData.earned - toilData.used - toilData.expired;

    if (hours > currentBalance) {
      return errorResponse(
        `Insufficient TOIL balance. Requested ${hours}h but only ${currentBalance.toFixed(1)}h available`
      );
    }

    // Create a TimeOffRequest with COMP_TIME deduction type
    const totalDays = hours / 8; // Convert hours to approximate days
    const endDate = new Date(requestDate);
    endDate.setHours(endDate.getHours() + hours);

    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        userId,
        type: "OTHER", // Using OTHER since TimeOffType doesn't have COMP_TIME
        startDate: requestDate,
        endDate,
        totalDays,
        reason: notes ? `TOIL: ${notes}` : "TOIL (Time Off In Lieu)",
        status: "PENDING",
        deductedFrom: "COMP_TIME",
        deductedDays: totalDays,
      },
    });

    // Try to update TOILBalance if model exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = prisma as any;
      if (db.tOILBalance) {
        await db.tOILBalance.updateMany({
          where: {
            userId,
            year: new Date().getFullYear(),
          },
          data: {
            usedHours: { increment: hours },
          },
        });
      }
    } catch {
      // Model doesn't exist yet — balance was calculated from shifts
    }

    return successResponse(
      {
        timeOffRequestId: timeOffRequest.id,
        hoursRequested: hours,
        date: requestDate.toISOString(),
        remainingBalance: currentBalance - hours,
      },
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse("No organization found", 400);
    }
    console.error("Error creating TOIL request:", error);
    return errorResponse("Failed to create TOIL request", 500);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves country code from organization's collective agreement.
 * Falls back to "NO" (Norway) when not available.
 */
async function resolveCountryCode(orgId: string): Promise<string> {
  try {
    const agreement = await prisma.collectiveAgreement.findUnique({
      where: { organizationId: orgId },
      select: { countryCode: true },
    });
    return agreement?.countryCode ?? "NO";
  } catch {
    return "NO";
  }
}

/**
 * Fallback: calculate TOIL from overtime shifts and actual hours this year.
 */
async function calculateFromShifts(
  userId: string,
  orgId: string,
  config: { conversionRate: number; maxAccumulation: number }
): Promise<{ earned: number; used: number; expired: number; earliestDate: Date | null }> {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  // Count overtime hours from Shift model this year
  const overtimeShifts = await prisma.shift.findMany({
    where: {
      userId,
      isOvertime: true,
      startTime: { gte: startOfYear },
      roster: { organizationId: orgId },
    },
    select: {
      startTime: true,
      endTime: true,
      breakMinutes: true,
    },
    orderBy: { startTime: "asc" },
  });

  // Get org default for max daily hours
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { maxDailyHours: true },
  });
  const maxDailyHours = org?.maxDailyHours ?? 9;

  let totalOTHours = 0;
  let earliestDate: Date | null = null;

  for (const s of overtimeShifts) {
    const hours = (s.endTime.getTime() - s.startTime.getTime()) / 3600000;
    const netHours = hours - s.breakMinutes / 60;
    const otHours = Math.max(0, netHours - maxDailyHours);
    if (otHours > 0) {
      totalOTHours += otHours;
      if (!earliestDate) {
        earliestDate = s.startTime;
      }
    }
  }

  const earned = calculateTOILEarned(totalOTHours, {
    enabled: true,
    expiryMonths: 12,
    maxAccumulation: config.maxAccumulation,
    conversionRate: config.conversionRate,
  });

  // Check how many COMP_TIME time-off requests were approved this year
  const usedRequests = await prisma.timeOffRequest.findMany({
    where: {
      userId,
      deductedFrom: "COMP_TIME",
      status: "APPROVED",
      startDate: { gte: startOfYear },
    },
    select: { totalDays: true },
  });

  const usedHours = usedRequests.reduce(
    (sum, r) => sum + Number(r.totalDays) * 8,
    0
  );

  return {
    earned,
    used: usedHours,
    expired: 0, // Cannot calculate expiry without dedicated model
    earliestDate,
  };
}
