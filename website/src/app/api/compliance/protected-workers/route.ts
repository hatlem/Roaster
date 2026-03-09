import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  requireRole,
  getOrganizationId,
} from "@/lib/api-utils";
import {
  isYoungWorker,
  calculateAge,
  checkYoungWorkerCompliance,
  checkYoungWorkerWeeklyHours,
  checkPregnantWorkerCompliance,
  canExceed48hAverage,
  type ProtectedWorkerViolation,
} from "@/lib/compliance/protected-workers";
import { calculateNightHours } from "@/lib/compliance/night-work";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProtectedWorkerUser {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  isPregnant: boolean;
  isNursingMother: boolean;
  wtdOptOut: boolean;
  wtdOptOutDate: Date | null;
  nightWorkerAssessed: boolean;
  nightWorkerAssessedAt: Date | null;
}

interface YoungWorkerReport {
  id: string;
  name: string;
  age: number;
  violations: ProtectedWorkerViolation[];
}

interface PregnantWorkerReport {
  id: string;
  name: string;
  nightShiftsAssigned: number;
  violations: ProtectedWorkerViolation[];
}

interface WtdOptOutReport {
  id: string;
  name: string;
  optOutDate: string | null;
  weeklyAverage: number;
}

interface NightWorkerAssessmentReport {
  id: string;
  name: string;
  lastAssessed: string | null;
}

interface ProtectedWorkerSummary {
  youngWorkerCount: number;
  youngWorkerViolations: number;
  pregnantWorkerCount: number;
  pregnantNightShiftViolations: number;
  wtdOptOutCount: number;
  nightWorkersNeedingAssessment: number;
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

// GET /api/compliance/protected-workers - Scan for protected worker issues
export async function GET(_request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    // Resolve country code from CollectiveAgreement or default to NO
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
      // No CBA configured — use default
    }

    // Try to fetch users with protected worker fields
    let users: ProtectedWorkerUser[];
    try {
      users = await prisma.user.findMany({
        where: { organizationId: orgId, isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          isPregnant: true,
          isNursingMother: true,
          wtdOptOut: true,
          wtdOptOutDate: true,
          nightWorkerAssessed: true,
          nightWorkerAssessedAt: true,
        },
      }) as ProtectedWorkerUser[];
    } catch {
      // Fields don't exist yet — return empty data with a note
      return successResponse({
        youngWorkers: [],
        pregnantWorkers: [],
        wtdOptOuts: [],
        nightWorkersWithoutAssessment: [],
        summary: {
          youngWorkerCount: 0,
          youngWorkerViolations: 0,
          pregnantWorkerCount: 0,
          pregnantNightShiftViolations: 0,
          wtdOptOutCount: 0,
          nightWorkersNeedingAssessment: 0,
        } satisfies ProtectedWorkerSummary,
        note: "Protected worker fields not yet in database. Run schema migration.",
      });
    }

    // Date range: look at shifts in the current and next 4 weeks
    const now = new Date();
    const rangeStart = startOfWeek(now, { weekStartsOn: 1 });
    const rangeEnd = endOfWeek(new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), {
      weekStartsOn: 1,
    });

    // Fetch shifts for all org users in the range
    const shifts = await prisma.shift.findMany({
      where: {
        roster: { organizationId: orgId },
        startTime: { gte: rangeStart },
        endTime: { lte: rangeEnd },
        userId: { in: users.map((u) => u.id) },
      },
      select: {
        id: true,
        userId: true,
        startTime: true,
        endTime: true,
        breakMinutes: true,
      },
    });

    // Group shifts by user
    const shiftsByUser = new Map<
      string,
      Array<{ id: string; startTime: Date; endTime: Date; breakMinutes: number }>
    >();
    for (const shift of shifts) {
      const existing = shiftsByUser.get(shift.userId) ?? [];
      existing.push(shift);
      shiftsByUser.set(shift.userId, existing);
    }

    const youngWorkers: YoungWorkerReport[] = [];
    const pregnantWorkers: PregnantWorkerReport[] = [];
    const wtdOptOuts: WtdOptOutReport[] = [];
    const nightWorkersWithoutAssessment: NightWorkerAssessmentReport[] = [];

    for (const user of users) {
      const name = `${user.firstName} ${user.lastName}`;
      const userShifts = shiftsByUser.get(user.id) ?? [];

      // ── Young Worker checks ──
      if (isYoungWorker(user.dateOfBirth)) {
        const age = calculateAge(user.dateOfBirth!);
        const violations: ProtectedWorkerViolation[] = [];

        // Check each shift for daily/night/break violations
        for (const shift of userShifts) {
          violations.push(
            ...checkYoungWorkerCompliance(shift, user.dateOfBirth!, countryCode)
          );
        }

        // Check weekly hours across all shifts
        violations.push(
          ...checkYoungWorkerWeeklyHours(userShifts, countryCode)
        );

        youngWorkers.push({ id: user.id, name, age, violations });
      }

      // ── Pregnant/Nursing Worker checks ──
      if (user.isPregnant || user.isNursingMother) {
        const violations: ProtectedWorkerViolation[] = [];
        let nightShiftsAssigned = 0;

        for (const shift of userShifts) {
          const shiftViolations = checkPregnantWorkerCompliance(
            shift,
            user.isPregnant,
            user.isNursingMother,
            countryCode
          );
          violations.push(...shiftViolations);
          if (shiftViolations.length > 0) {
            nightShiftsAssigned++;
          }
        }

        pregnantWorkers.push({
          id: user.id,
          name,
          nightShiftsAssigned,
          violations,
        });
      }

      // ── WTD 48h Opt-Out tracking ──
      if (user.wtdOptOut) {
        // Calculate average weekly hours over the last 17 weeks (WTD reference period)
        const seventeenWeeksAgo = subWeeks(now, 17);
        const recentShifts = await prisma.shift.findMany({
          where: {
            userId: user.id,
            roster: { organizationId: orgId },
            startTime: { gte: seventeenWeeksAgo },
            endTime: { lte: now },
          },
          select: { startTime: true, endTime: true, breakMinutes: true },
        });

        let totalHours = 0;
        for (const s of recentShifts) {
          const durationMs =
            new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
          totalHours += durationMs / (1000 * 60 * 60) - s.breakMinutes / 60;
        }

        const weeklyAverage = totalHours / 17;

        wtdOptOuts.push({
          id: user.id,
          name,
          optOutDate: user.wtdOptOutDate
            ? user.wtdOptOutDate.toISOString()
            : null,
          weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        });
      }

      // ── Night Worker Health Assessment checks ──
      // Any employee who works night shifts should have a health assessment.
      // Check if any of their shifts include night hours.
      const hasNightShifts = userShifts.some(
        (s) => calculateNightHours(s, countryCode) > 0
      );

      if (hasNightShifts && !user.nightWorkerAssessed) {
        nightWorkersWithoutAssessment.push({
          id: user.id,
          name,
          lastAssessed: user.nightWorkerAssessedAt
            ? user.nightWorkerAssessedAt.toISOString()
            : null,
        });
      }
    }

    const summary: ProtectedWorkerSummary = {
      youngWorkerCount: youngWorkers.length,
      youngWorkerViolations: youngWorkers.reduce(
        (sum, yw) => sum + yw.violations.length,
        0
      ),
      pregnantWorkerCount: pregnantWorkers.length,
      pregnantNightShiftViolations: pregnantWorkers.reduce(
        (sum, pw) => sum + pw.violations.length,
        0
      ),
      wtdOptOutCount: wtdOptOuts.length,
      nightWorkersNeedingAssessment: nightWorkersWithoutAssessment.length,
    };

    return successResponse({
      youngWorkers,
      pregnantWorkers,
      wtdOptOuts,
      nightWorkersWithoutAssessment,
      summary,
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
    console.error("Error scanning protected workers:", error);
    return errorResponse("Failed to scan protected workers", 500);
  }
}
