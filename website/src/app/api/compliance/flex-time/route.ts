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
  getFlexTimeConfig,
  calculateDelta,
  buildFlexTimeStatus,
  getSettlementPeriodStart,
} from "@/lib/compliance/flex-time";

// ─── GET /api/compliance/flex-time ───────────────────────────────────────────
// Get flex-time account balance for current user or specific employee.
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
      select: { organizationId: true, contractedHours: true },
    });

    if (!targetUser || targetUser.organizationId !== orgId) {
      return errorResponse("Employee not found", 404);
    }

    // Resolve country code from collective agreement or default to NO
    const countryCode = await resolveCountryCode(orgId);
    const config = getFlexTimeConfig(countryCode);

    const now = new Date();
    const periodStart = getSettlementPeriodStart(now, config.settlementPeriod);

    // Try to read from FlexTimeAccount model first (may not exist yet)
    let flexData: { balance: number; entries: unknown[] } | null = null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = prisma as any;
      if (db.flexTimeAccount) {
        const account = await db.flexTimeAccount.findFirst({
          where: { userId: targetUserId },
        });

        if (account) {
          let entries: unknown[] = [];
          try {
            if (db.flexTimeEntry) {
              entries = await db.flexTimeEntry.findMany({
                where: {
                  accountId: account.id,
                  date: { gte: periodStart },
                },
                orderBy: { date: "desc" },
              });
            }
          } catch {
            // FlexTimeEntry model doesn't exist
          }

          flexData = {
            balance: Number(account.balance ?? 0),
            entries,
          };
        }
      }
    } catch {
      // FlexTimeAccount model doesn't exist yet — fall through to fallback
    }

    // Fallback: calculate from scheduled shifts vs actual hours
    if (!flexData) {
      flexData = await calculateFromHours(
        targetUserId,
        orgId,
        periodStart,
        targetUser.contractedHours ? Number(targetUser.contractedHours) : null
      );
    }

    const status = buildFlexTimeStatus(flexData.balance, config, now);

    return successResponse({
      userId: targetUserId,
      countryCode,
      config: {
        enabled: config.enabled,
        maxPositiveHours: config.maxPositiveHours,
        maxNegativeHours: config.maxNegativeHours,
        settlementPeriod: config.settlementPeriod,
        autoSettle: config.autoSettle,
      },
      ...status,
      entries: flexData.entries,
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
    console.error("Error fetching flex-time balance:", error);
    return errorResponse("Failed to fetch flex-time balance", 500);
  }
}

// ─── POST /api/compliance/flex-time ──────────────────────────────────────────
// Record a flex-time entry (ADMIN/MANAGER only).
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);
    const session = await requireAuth();
    const orgId = await getOrganizationId(session.user.id);

    const body = await request.json();
    const { employeeId, date, scheduledHours, actualHours, notes } = body as {
      employeeId?: string;
      date?: string;
      scheduledHours?: number;
      actualHours?: number;
      notes?: string;
    };

    if (!employeeId) {
      return errorResponse("employeeId is required");
    }
    if (!date) {
      return errorResponse("date is required");
    }
    if (scheduledHours === undefined || scheduledHours === null) {
      return errorResponse("scheduledHours is required");
    }
    if (actualHours === undefined || actualHours === null) {
      return errorResponse("actualHours is required");
    }

    const entryDate = new Date(date);
    if (isNaN(entryDate.getTime())) {
      return errorResponse("Invalid date format");
    }

    // Verify employee belongs to same organization
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { organizationId: true },
    });

    if (!employee || employee.organizationId !== orgId) {
      return errorResponse("Employee not found", 404);
    }

    const delta = calculateDelta(scheduledHours, actualHours);

    // Try to create FlexTimeEntry if model exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = prisma as any;
      if (db.flexTimeEntry && db.flexTimeAccount) {
        // Get or create account
        let account = await db.flexTimeAccount.findFirst({
          where: { userId: employeeId },
        });

        if (!account) {
          account = await db.flexTimeAccount.create({
            data: {
              userId: employeeId,
              balance: 0,
            },
          });
        }

        // Create entry
        const entry = await db.flexTimeEntry.create({
          data: {
            accountId: account.id,
            date: entryDate,
            scheduledHours,
            actualHours,
            delta,
            notes: notes ?? null,
            recordedBy: session.user.id,
          },
        });

        // Update account balance
        await db.flexTimeAccount.update({
          where: { id: account.id },
          data: {
            balance: { increment: delta },
          },
        });

        const countryCode = await resolveCountryCode(orgId);
        const config = getFlexTimeConfig(countryCode);
        const updatedAccount = await db.flexTimeAccount.findUnique({
          where: { id: account.id },
        });
        const status = buildFlexTimeStatus(
          Number(updatedAccount.balance),
          config
        );

        return successResponse(
          {
            entry,
            delta,
            ...status,
          },
          201
        );
      }
    } catch {
      // FlexTimeEntry / FlexTimeAccount models don't exist
    }

    // If models don't exist, return a helpful error
    return errorResponse(
      "Flex-time entry recording requires the FlexTimeAccount and FlexTimeEntry database models. " +
        "These models are being added to the schema. " +
        "In the meantime, flex-time balances are calculated from shift data.",
      501
    );
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
    console.error("Error recording flex-time entry:", error);
    return errorResponse("Failed to record flex-time entry", 500);
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
 * Fallback: calculate flex-time balance from scheduled shifts vs actual hours.
 */
async function calculateFromHours(
  userId: string,
  orgId: string,
  periodStart: Date,
  contractedWeeklyHours: number | null
): Promise<{ balance: number; entries: unknown[] }> {
  // Get scheduled shifts for the settlement period
  const shifts = await prisma.shift.findMany({
    where: {
      userId,
      startTime: { gte: periodStart },
      roster: { organizationId: orgId },
    },
    select: {
      startTime: true,
      endTime: true,
      breakMinutes: true,
    },
    orderBy: { startTime: "asc" },
  });

  const scheduledHours = shifts.reduce((sum, s) => {
    const hours = (s.endTime.getTime() - s.startTime.getTime()) / 3600000;
    return sum + hours - s.breakMinutes / 60;
  }, 0);

  // Get actual hours worked from ActualHours model
  const actualRecords = await prisma.actualHours.findMany({
    where: {
      userId,
      date: { gte: periodStart },
    },
    select: {
      date: true,
      totalHours: true,
    },
    orderBy: { date: "asc" },
  });

  const actualTotalHours = actualRecords.reduce(
    (sum, r) => sum + r.totalHours,
    0
  );

  // If no actual hours recorded, use contracted hours as reference
  let balance: number;
  if (actualRecords.length === 0 && contractedWeeklyHours) {
    // No clock-in data yet — balance is 0 (no deviation)
    balance = 0;
  } else {
    balance = actualTotalHours - scheduledHours;
  }

  // Build pseudo-entries for display
  const entries = actualRecords.map((r) => ({
    date: r.date,
    actualHours: r.totalHours,
    delta: 0, // Cannot compute per-day delta without matching shifts
  }));

  return { balance, entries };
}
