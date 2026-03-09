import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { startOfWeek, endOfWeek, subDays, startOfYear } from "date-fns";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.compliance.title };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeWeekStats {
  id: string;
  name: string;
  weekHours: number;
  overtimeHours: number;
  yearlyOvertimeHours: number;
  dailyViolations: number;
  weeklyViolation: boolean;
}

interface RestViolation {
  id: string;
  employeeName: string;
  startTime: Date;
}

interface NightWorkStat {
  id: string;
  name: string;
  nightShiftCount: number;
  longShiftCount: number;
}

interface CollectiveAgreementData {
  name: string;
  countryCode: string;
  sector: string | null;
  effectiveFrom: Date | null;
  maxDailyHours: number | null;
  maxWeeklyHours: number | null;
  minDailyRest: number | null;
  nightWorkAllowed: boolean;
}

interface ComplianceData {
  // Health overview
  complianceScore: number;
  workingHoursStatus: "green" | "amber" | "red";
  restPeriodsStatus: "green" | "amber" | "red";
  overtimeTiersStatus: "green" | "amber" | "red";
  workingHoursSummary: string;
  restPeriodsSummary: string;
  overtimeTiersSummary: string;

  // Working hours
  weekShiftStats: EmployeeWeekStats[];
  orgMaxDailyHours: number;
  orgMaxWeeklyHours: number;

  // Rest periods
  restViolations30Days: number;
  restViolationsList: RestViolation[];
  countryCode: string;

  // Overtime (year)
  yearlyOvertimeLimit: number;

  // Night work & breaks
  nightWorkStats: NightWorkStat[];
  longShiftCount30Days: number;

  // Collective agreement
  collectiveAgreement: CollectiveAgreementData | null;

  // Audit log
  auditLogEntries: Array<{
    id: string;
    action: string;
    entityType: string;
    timestamp: Date;
    userEmail: string | null;
  }>;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getComplianceData(orgId: string | undefined): Promise<ComplianceData> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thirtyDaysAgo = subDays(now, 30);
  const yearStart = startOfYear(now);

  const NORWAY_YEARLY_OT_LIMIT = 200;

  // Fallback empty state when not authenticated
  const empty: ComplianceData = {
    complianceScore: 100,
    workingHoursStatus: "green",
    restPeriodsStatus: "green",
    overtimeTiersStatus: "green",
    workingHoursSummary: "No data",
    restPeriodsSummary: "No data",
    overtimeTiersSummary: "No data",
    weekShiftStats: [],
    orgMaxDailyHours: 9,
    orgMaxWeeklyHours: 40,
    restViolations30Days: 0,
    restViolationsList: [],
    countryCode: "NO",
    yearlyOvertimeLimit: NORWAY_YEARLY_OT_LIMIT,
    nightWorkStats: [],
    longShiftCount30Days: 0,
    collectiveAgreement: null,
    auditLogEntries: [],
  };

  if (!orgId) return empty;

  try {
    // Load org settings
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        maxDailyHours: true,
        maxWeeklyHours: true,
        minDailyRest: true,
      },
    });

    const maxDailyHours = org?.maxDailyHours ?? 9;
    const maxWeeklyHours = org?.maxWeeklyHours ?? 40;

    // ── Parallel queries ──────────────────────────────────────────────────────

    const [weekShifts, restViolations, yearOvertimeShifts, recentShifts, auditLogs, collectiveAgreement] =
      await Promise.all([
        // Current week shifts for working hours section
        prisma.shift.findMany({
          where: {
            roster: { organizationId: orgId },
            startTime: { gte: weekStart, lte: weekEnd },
          },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { startTime: "asc" },
        }).catch(() => []),

        // Rest violations last 30 days
        prisma.shift.findMany({
          where: {
            roster: { organizationId: orgId },
            violatesRestPeriod: true,
            startTime: { gte: thirtyDaysAgo },
          },
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { startTime: "desc" },
          take: 20,
        }).catch(() => []),

        // Year overtime shifts (for yearly limit tracking)
        prisma.shift.findMany({
          where: {
            roster: { organizationId: orgId },
            isOvertime: true,
            startTime: { gte: yearStart },
          },
          select: {
            id: true,
            userId: true,
            startTime: true,
            endTime: true,
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { startTime: "asc" },
        }).catch(() => []),

        // Last 30 days shifts (for night work & break detection)
        prisma.shift.findMany({
          where: {
            roster: { organizationId: orgId },
            startTime: { gte: thirtyDaysAgo },
          },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { startTime: "desc" },
        }).catch(() => []),

        // Audit log
        prisma.auditLog.findMany({
          where: { roster: { organizationId: orgId } },
          orderBy: { timestamp: "desc" },
          take: 8,
          select: {
            id: true,
            action: true,
            entityType: true,
            timestamp: true,
            userEmail: true,
          },
        }).catch(() => []),

        // Collective agreement — model may not exist yet
        prisma.collectiveAgreement
          .findUnique({ where: { organizationId: orgId } })
          .catch(() => null),
      ]);

    // ── Working Hours: aggregate per employee ─────────────────────────────────

    const weekStatsByEmployee = new Map<string, EmployeeWeekStats>();

    for (const shift of weekShifts) {
      if (!shift.user) continue;
      const durationMs = shift.endTime.getTime() - shift.startTime.getTime();
      const durationH = durationMs / 3_600_000;

      const existing = weekStatsByEmployee.get(shift.userId);
      if (existing) {
        existing.weekHours += durationH;
        if (shift.isOvertime) existing.overtimeHours += durationH;
        if (shift.violatesDailyLimit) existing.dailyViolations++;
        if (shift.violatesWeeklyLimit) existing.weeklyViolation = true;
      } else {
        weekStatsByEmployee.set(shift.userId, {
          id: shift.userId,
          name: `${shift.user.firstName} ${shift.user.lastName}`,
          weekHours: durationH,
          overtimeHours: shift.isOvertime ? durationH : 0,
          yearlyOvertimeHours: 0,
          dailyViolations: shift.violatesDailyLimit ? 1 : 0,
          weeklyViolation: shift.violatesWeeklyLimit,
        });
      }
    }

    // Add yearly overtime totals
    for (const shift of yearOvertimeShifts) {
      const durationH = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000;
      const entry = weekStatsByEmployee.get(shift.userId);
      if (entry) {
        entry.yearlyOvertimeHours += durationH;
      } else {
        // Not in this week's data — add a skeleton entry
        if (shift.user) {
          weekStatsByEmployee.set(shift.userId, {
            id: shift.userId,
            name: `${shift.user.firstName} ${shift.user.lastName}`,
            weekHours: 0,
            overtimeHours: 0,
            yearlyOvertimeHours: durationH,
            dailyViolations: 0,
            weeklyViolation: false,
          });
        }
      }
    }

    // Also ensure year OT totals are summed for employees already in the map
    const yearOTByUser = new Map<string, number>();
    for (const shift of yearOvertimeShifts) {
      const h = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000;
      yearOTByUser.set(shift.userId, (yearOTByUser.get(shift.userId) ?? 0) + h);
    }
    for (const [uid, stats] of weekStatsByEmployee) {
      stats.yearlyOvertimeHours = yearOTByUser.get(uid) ?? 0;
    }

    const weekShiftStats = Array.from(weekStatsByEmployee.values()).sort((a, b) =>
      b.weekHours - a.weekHours
    );

    // ── Night work & breaks ───────────────────────────────────────────────────

    const nightByUser = new Map<string, { id: string; name: string; nightShiftCount: number; longShiftCount: number }>();

    for (const shift of recentShifts) {
      if (!shift.user) continue;
      const startH = shift.startTime.getHours();
      const endH = shift.endTime.getHours();
      const durationH = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000;
      const isNight = startH < 6 || endH < 6 || startH >= 21;
      // Norway: shifts over 5.5h require a break
      const isLong = durationH > 5.5;

      const entry = nightByUser.get(shift.userId);
      if (entry) {
        if (isNight) entry.nightShiftCount++;
        if (isLong) entry.longShiftCount++;
      } else {
        nightByUser.set(shift.userId, {
          id: shift.userId,
          name: `${shift.user.firstName} ${shift.user.lastName}`,
          nightShiftCount: isNight ? 1 : 0,
          longShiftCount: isLong ? 1 : 0,
        });
      }
    }

    const nightWorkStats = Array.from(nightByUser.values())
      .filter((e) => e.nightShiftCount > 0 || e.longShiftCount > 0)
      .sort((a, b) => b.nightShiftCount - a.nightShiftCount);

    const longShiftCount30Days = recentShifts.filter((s) => {
      const h = (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000;
      return h > 5.5;
    }).length;

    // ── Compliance score ──────────────────────────────────────────────────────

    const totalWeekShifts = weekShifts.length;
    const restViolations30Days = restViolations.length;
    const dailyViolationsCount = weekShifts.filter((s) => s.violatesDailyLimit).length;
    const weeklyViolationsCount = weekShifts.filter((s) => s.violatesWeeklyLimit).length;
    const totalViolations = restViolations30Days + dailyViolationsCount + weeklyViolationsCount;
    const denominator = Math.max(totalWeekShifts + restViolations30Days, 1);
    const complianceScore = Math.round(
      Math.max(0, Math.min(100, ((denominator - totalViolations) / denominator) * 100))
    );

    // ── Status colours for dimension cards ───────────────────────────────────

    const approachingWeeklyLimit = weekShiftStats.filter(
      (e) => e.weekHours >= maxWeeklyHours - 2
    ).length;
    const approachingYearlyOT = weekShiftStats.filter(
      (e) => e.yearlyOvertimeHours >= NORWAY_YEARLY_OT_LIMIT * 0.8
    ).length;

    const workingHoursStatus =
      dailyViolationsCount > 0 || weeklyViolationsCount > 0
        ? "red"
        : approachingWeeklyLimit > 0
          ? "amber"
          : "green";

    const restPeriodsStatus =
      restViolations30Days > 5
        ? "red"
        : restViolations30Days > 0
          ? "amber"
          : "green";

    const overtimeTiersStatus =
      approachingYearlyOT > 0
        ? "amber"
        : "green";

    const workingHoursSummary =
      dailyViolationsCount > 0
        ? `${dailyViolationsCount} daily limit exceeded this week`
        : approachingWeeklyLimit > 0
          ? `${approachingWeeklyLimit} employee${approachingWeeklyLimit > 1 ? "s" : ""} approaching weekly limit`
          : "All employees within limits";

    const restPeriodsSummary =
      restViolations30Days === 0
        ? "No violations in last 30 days"
        : `${restViolations30Days} violation${restViolations30Days > 1 ? "s" : ""} in last 30 days`;

    const overtimeTiersSummary =
      approachingYearlyOT > 0
        ? `${approachingYearlyOT} employee${approachingYearlyOT > 1 ? "s" : ""} approaching yearly limit`
        : "All overtime within limits";

    return {
      complianceScore,
      workingHoursStatus,
      restPeriodsStatus,
      overtimeTiersStatus,
      workingHoursSummary,
      restPeriodsSummary,
      overtimeTiersSummary,
      weekShiftStats,
      orgMaxDailyHours: maxDailyHours,
      orgMaxWeeklyHours: maxWeeklyHours,
      restViolations30Days,
      restViolationsList: restViolations.slice(0, 10).map((s) => ({
        id: s.id,
        employeeName: s.user
          ? `${s.user.firstName} ${s.user.lastName}`
          : "Unknown",
        startTime: s.startTime,
      })),
      countryCode: "NO",
      yearlyOvertimeLimit: NORWAY_YEARLY_OT_LIMIT,
      nightWorkStats: nightWorkStats.slice(0, 10),
      longShiftCount30Days,
      collectiveAgreement: collectiveAgreement
        ? {
            name: collectiveAgreement.name,
            countryCode: collectiveAgreement.countryCode,
            sector: collectiveAgreement.sector,
            effectiveFrom: collectiveAgreement.effectiveFrom,
            maxDailyHours: collectiveAgreement.maxDailyHours,
            maxWeeklyHours: collectiveAgreement.maxWeeklyHours,
            minDailyRest: collectiveAgreement.minDailyRest,
            nightWorkAllowed: collectiveAgreement.nightWorkAllowed,
          }
        : null,
      auditLogEntries: auditLogs,
    };
  } catch {
    return empty;
  }
}

// ─── Helper components (inline) ───────────────────────────────────────────────

function StatusBadge({ status }: { status: "green" | "amber" | "red" }) {
  const map = {
    green: "bg-forest/10 text-forest",
    amber: "bg-gold/10 text-gold",
    red: "bg-terracotta/10 text-terracotta",
  };
  const label = { green: "Compliant", amber: "Warning", red: "Violation" };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function StatusDot({ status }: { status: "green" | "amber" | "red" }) {
  const map = {
    green: "bg-forest",
    amber: "bg-gold",
    red: "bg-terracotta",
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status]}`} />;
}

function ProgressBar({
  pct,
  status,
}: {
  pct: number;
  status: "green" | "amber" | "red";
}) {
  const bar = {
    green: "bg-forest",
    amber: "bg-gold",
    red: "bg-terracotta",
  };
  return (
    <div className="h-1.5 bg-stone/20 rounded-full overflow-hidden w-full">
      <div
        className={`h-full rounded-full ${bar[status]}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function hourStatusFor(
  hours: number,
  max: number
): "green" | "amber" | "red" {
  if (hours >= max) return "red";
  if (hours >= max - 2) return "amber";
  return "green";
}

function fmt(h: number) {
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CompliancePage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as { organizationId?: string })?.organizationId;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.compliance;
  const data = await getComplianceData(orgId);

  // Circular progress ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (data.complianceScore / 100) * circumference;
  const rateColor =
    data.complianceScore >= 95
      ? "text-forest"
      : data.complianceScore >= 80
        ? "text-gold"
        : "text-terracotta";
  const rateStroke =
    data.complianceScore >= 95
      ? "#2d5a4a"
      : data.complianceScore >= 80
        ? "#b8860b"
        : "#c65d3b";

  const scoreLabel =
    data.complianceScore >= 95
      ? d.excellent
      : data.complianceScore >= 80
        ? "Good"
        : "Needs Attention";

  const scoreBadgeColor =
    data.complianceScore >= 95
      ? "text-forest bg-forest/10"
      : data.complianceScore >= 80
        ? "text-gold bg-gold/10"
        : "text-terracotta bg-terracotta/10";

  return (
    <div className="p-8 space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden animate-fade-up">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{
            background: "linear-gradient(135deg, #2d5a4a, #3a6b7c)",
            opacity: 0.06,
          }}
        />
        <div className="relative">
          <h1 className="font-display text-4xl md:text-5xl mb-2">{d.title}</h1>
          <p className="text-ink/60 animate-fade-up delay-1">{d.subtitle}</p>
        </div>
      </div>

      {/* ── Section 1: Compliance Health Overview ───────────────────────────── */}
      <section className="animate-fade-up delay-1">
        <h2 className="font-display text-xl mb-4">Compliance Health</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {/* Circular score */}
          <div className="bg-white rounded-2xl p-6 border border-stone/50 flex flex-col items-center justify-center card-hover">
            <div className="relative w-40 h-40 mb-3 animate-scale-in delay-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#e8e4dd"
                  strokeWidth="10"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={rateStroke}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-display text-3xl ${rateColor}`}>
                  {data.complianceScore}%
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${scoreBadgeColor}`}
                >
                  {scoreLabel}
                </span>
              </div>
            </div>
            <p className="text-ink/60 text-sm text-center">{d.overallComplianceRate}</p>
          </div>

          {/* Working Hours card */}
          <div
            className={`bg-white rounded-2xl p-6 border border-stone/50 card-hover animate-fade-up delay-2`}
            style={{
              borderTop: `2px solid ${data.workingHoursStatus === "green" ? "#2d5a4a" : data.workingHoursStatus === "amber" ? "#b8860b" : "#c65d3b"}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-ocean/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-clock text-ocean text-lg" />
              </div>
              <StatusBadge status={data.workingHoursStatus} />
            </div>
            <p className="font-display text-lg mb-1">Working Hours</p>
            <p className="text-ink/60 text-sm">{data.workingHoursSummary}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink/40">
              <StatusDot status={data.workingHoursStatus} />
              <span>Daily max: {data.orgMaxDailyHours}h · Weekly: {data.orgMaxWeeklyHours}h</span>
            </div>
          </div>

          {/* Rest Periods card */}
          <div
            className="bg-white rounded-2xl p-6 border border-stone/50 card-hover animate-fade-up delay-3"
            style={{
              borderTop: `2px solid ${data.restPeriodsStatus === "green" ? "#2d5a4a" : data.restPeriodsStatus === "amber" ? "#b8860b" : "#c65d3b"}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-forest/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-moon text-forest text-lg" />
              </div>
              <StatusBadge status={data.restPeriodsStatus} />
            </div>
            <p className="font-display text-lg mb-1">Rest Periods</p>
            <p className="text-ink/60 text-sm">{data.restPeriodsSummary}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink/40">
              <StatusDot status={data.restPeriodsStatus} />
              <span>Min 11h daily · 35h weekly</span>
            </div>
          </div>

          {/* Overtime Tiers card */}
          <div
            className="bg-white rounded-2xl p-6 border border-stone/50 card-hover animate-fade-up delay-4"
            style={{
              borderTop: `2px solid ${data.overtimeTiersStatus === "green" ? "#2d5a4a" : data.overtimeTiersStatus === "amber" ? "#b8860b" : "#c65d3b"}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gold/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-hourglass-half text-gold text-lg" />
              </div>
              <StatusBadge status={data.overtimeTiersStatus} />
            </div>
            <p className="font-display text-lg mb-1">Overtime Tiers</p>
            <p className="text-ink/60 text-sm">{data.overtimeTiersSummary}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink/40">
              <StatusDot status={data.overtimeTiersStatus} />
              <span>10h/wk · 25h/4wk · {data.yearlyOvertimeLimit}h/yr</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Working Hours Monitoring ─────────────────────────────── */}
      <section className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-2">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-ocean/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-chart-bar text-ocean" />
          </div>
          <div>
            <h2 className="font-display text-xl">Working Hours Monitoring</h2>
            <p className="text-ink/50 text-sm">Current week · per employee</p>
          </div>
        </div>

        {data.weekShiftStats.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
              <i className="fas fa-calendar-week text-2xl text-stone/60" />
            </div>
            <p className="text-ink/60 font-medium mb-1">No shifts this week</p>
            <p className="text-ink/40 text-sm">Shifts will appear here once scheduled</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warm-dark/5 border-b border-stone/50">
                <tr>
                  <th className="text-left p-3 font-semibold">Employee</th>
                  <th className="text-left p-3 font-semibold">This Week</th>
                  <th className="text-left p-3 font-semibold">Weekly Progress</th>
                  <th className="text-left p-3 font-semibold">Daily Limit</th>
                  <th className="text-left p-3 font-semibold">Weekly Limit</th>
                </tr>
              </thead>
              <tbody>
                {data.weekShiftStats.map((emp, idx) => {
                  const weekPct = (emp.weekHours / data.orgMaxWeeklyHours) * 100;
                  const weekStatus = hourStatusFor(emp.weekHours, data.orgMaxWeeklyHours);
                  const dailyStatus: "green" | "amber" | "red" =
                    emp.dailyViolations > 0 ? "red" : "green";
                  const weeklyStatus: "green" | "amber" | "red" = emp.weeklyViolation
                    ? "red"
                    : emp.weekHours >= data.orgMaxWeeklyHours - 2
                      ? "amber"
                      : "green";

                  const textColor = {
                    green: "text-forest",
                    amber: "text-gold",
                    red: "text-terracotta",
                  }[weekStatus];

                  return (
                    <tr
                      key={emp.id}
                      className={`border-b border-stone/30 ${idx % 2 === 0 ? "bg-cream/30" : "bg-white"}`}
                    >
                      <td className="p-3 font-medium">{emp.name}</td>
                      <td className={`p-3 font-semibold ${textColor}`}>
                        {fmt(emp.weekHours)}
                        <span className="text-ink/40 font-normal ml-1 text-xs">
                          / {data.orgMaxWeeklyHours}h
                        </span>
                      </td>
                      <td className="p-3 min-w-[160px]">
                        <ProgressBar pct={weekPct} status={weekStatus} />
                        <span className="text-xs text-ink/40 mt-0.5 block">
                          {Math.round(weekPct)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={dailyStatus} />
                        {emp.dailyViolations > 0 && (
                          <span className="text-xs text-terracotta ml-2">
                            {emp.dailyViolations}x exceeded
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={weeklyStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Section 3: Rest Period Compliance ───────────────────────────────── */}
      <section className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-3">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-moon text-forest" />
            </div>
            <div>
              <h2 className="font-display text-xl">Rest Period Compliance</h2>
              <p className="text-ink/50 text-sm">
                Last 30 days · {data.countryCode === "NO" ? "Norwegian Working Environment Act" : `Country: ${data.countryCode}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-display text-3xl ${data.restViolations30Days === 0 ? "text-forest" : "text-terracotta"}`}>
              {data.restViolations30Days}
            </p>
            <p className="text-xs text-ink/50">violations</p>
          </div>
        </div>

        {data.restViolationsList.length === 0 ? (
          <div className="flex items-center gap-4 bg-forest/5 border border-forest/20 rounded-xl p-4">
            <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center shrink-0">
              <i className="fas fa-check-circle text-2xl text-forest" />
            </div>
            <div>
              <p className="font-semibold text-forest">All rest periods compliant</p>
              <p className="text-sm text-ink/50">No violations detected in the last 30 days</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-ink/60">
              <i className="fas fa-info-circle text-ocean mr-2" />
              Minimum 11 hours between shifts required by law
              {data.countryCode === "NO" ? " (§10-8 Arbeidsmiljøloven)" : ""}.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-warm-dark/5 border-b border-stone/50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Employee</th>
                    <th className="text-left p-3 font-semibold">Shift Date</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.restViolationsList.map((v, idx) => (
                    <tr
                      key={v.id}
                      className={`border-b border-stone/30 ${idx % 2 === 0 ? "bg-cream/30" : "bg-white"}`}
                    >
                      <td className="p-3 font-medium">{v.employeeName}</td>
                      <td className="p-3 text-ink/60">
                        {v.startTime.toLocaleDateString(locale, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-terracotta/10 text-terracotta">
                          <i className="fas fa-exclamation-triangle mr-1" />
                          &lt;11h rest
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ── Section 4: Overtime Status ───────────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-fire text-gold" />
          </div>
          <div>
            <h2 className="font-display text-xl">Overtime Status</h2>
            <p className="text-ink/50 text-sm">
              Norway: max 10h/week · 25h/4 weeks · {data.yearlyOvertimeLimit}h/year
            </p>
          </div>
        </div>

        {data.weekShiftStats.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <i className="fas fa-hourglass-half text-3xl text-stone/40 mb-3" />
            <p className="text-ink/50 font-medium">No overtime data this week</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.weekShiftStats.map((emp) => {
              const yearlyPct = (emp.yearlyOvertimeHours / data.yearlyOvertimeLimit) * 100;
              const yearlyStatus: "green" | "amber" | "red" =
                yearlyPct >= 100 ? "red" : yearlyPct >= 80 ? "amber" : "green";

              return (
                <div
                  key={emp.id}
                  className={`p-4 rounded-xl border ${
                    yearlyStatus === "red"
                      ? "border-terracotta/30 bg-terracotta/5"
                      : yearlyStatus === "amber"
                        ? "border-gold/30 bg-gold/5"
                        : "border-stone/30 bg-cream/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{emp.name}</span>
                    <div className="flex items-center gap-3">
                      {emp.overtimeHours > 0 && (
                        <span className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                          {fmt(emp.overtimeHours)} OT this week
                        </span>
                      )}
                      {yearlyStatus !== "green" && (
                        <StatusBadge status={yearlyStatus} />
                      )}
                    </div>
                  </div>

                  {/* Yearly overtime progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-ink/50 mb-1">
                        <span>Yearly OT: {fmt(emp.yearlyOvertimeHours)}</span>
                        <span>{data.yearlyOvertimeLimit}h limit</span>
                      </div>
                      <ProgressBar pct={yearlyPct} status={yearlyStatus} />
                    </div>
                    <span
                      className={`text-sm font-bold w-10 text-right ${
                        yearlyStatus === "red"
                          ? "text-terracotta"
                          : yearlyStatus === "amber"
                            ? "text-gold"
                            : "text-forest"
                      }`}
                    >
                      {Math.round(yearlyPct)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section 5: Night Work & Breaks ──────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-star-and-crescent text-ocean" />
            </div>
            <div>
              <h2 className="font-display text-xl">Night Work &amp; Breaks</h2>
              <p className="text-ink/50 text-sm">Last 30 days</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-ocean/10 text-ocean border border-ocean/20">
            Beta
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <div className="bg-cream/50 border border-stone/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <i className="fas fa-moon text-ocean text-sm" />
              <span className="text-sm font-semibold">Night Shifts Detected</span>
            </div>
            <p className="font-display text-2xl text-ocean">
              {data.nightWorkStats.reduce((sum, e) => sum + e.nightShiftCount, 0)}
            </p>
            <p className="text-xs text-ink/50 mt-0.5">
              Shifts starting before 06:00 or after 21:00
            </p>
          </div>
          <div className="bg-cream/50 border border-stone/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <i className="fas fa-coffee text-gold text-sm" />
              <span className="text-sm font-semibold">Shifts Requiring Break</span>
            </div>
            <p className="font-display text-2xl text-gold">{data.longShiftCount30Days}</p>
            <p className="text-xs text-ink/50 mt-0.5">
              Shifts over 5.5 hours (Norwegian break threshold)
            </p>
          </div>
        </div>

        {data.nightWorkStats.length === 0 ? (
          <div className="flex items-center gap-3 bg-forest/5 border border-forest/20 rounded-xl p-4 text-sm">
            <i className="fas fa-check-circle text-forest" />
            <span className="text-forest font-medium">No night shifts in last 30 days</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warm-dark/5 border-b border-stone/50">
                <tr>
                  <th className="text-left p-3 font-semibold">Employee</th>
                  <th className="text-left p-3 font-semibold">Night Shifts</th>
                  <th className="text-left p-3 font-semibold">Shifts &gt;5.5h</th>
                </tr>
              </thead>
              <tbody>
                {data.nightWorkStats.map((emp, idx) => (
                  <tr
                    key={emp.id}
                    className={`border-b border-stone/30 ${idx % 2 === 0 ? "bg-cream/30" : "bg-white"}`}
                  >
                    <td className="p-3 font-medium">{emp.name}</td>
                    <td className="p-3">
                      {emp.nightShiftCount > 0 ? (
                        <span className="text-ocean font-semibold">{emp.nightShiftCount}</span>
                      ) : (
                        <span className="text-ink/40">–</span>
                      )}
                    </td>
                    <td className="p-3">
                      {emp.longShiftCount > 0 ? (
                        <span className="text-gold font-semibold">{emp.longShiftCount}</span>
                      ) : (
                        <span className="text-ink/40">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 text-xs text-ink/50 bg-stone/5 border border-stone/20 rounded-xl p-3">
          <i className="fas fa-info-circle mt-0.5 shrink-0" />
          <span>
            Night work detection is informational only. Violation flagging will be enabled in a future update
            alongside the full night-work rules engine.
          </span>
        </div>
      </section>

      {/* ── Section 6: Collective Agreement ─────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-handshake text-forest" />
          </div>
          <div>
            <h2 className="font-display text-xl">Collective Agreement</h2>
            <p className="text-ink/50 text-sm">CBA overrides for compliance rules</p>
          </div>
        </div>

        {data.collectiveAgreement ? (
          <div className="space-y-4">
            <div className="bg-forest/5 border border-forest/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-forest">{data.collectiveAgreement.name}</p>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-forest/10 text-forest">
                  Active
                </span>
              </div>
              {data.collectiveAgreement.effectiveFrom && (
                <p className="text-sm text-ink/60 mb-3">
                  Active since{" "}
                  {data.collectiveAgreement.effectiveFrom.toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {data.collectiveAgreement.maxDailyHours && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-forest text-xs" />
                    <span>
                      Daily max:{" "}
                      <strong>{data.collectiveAgreement.maxDailyHours}h</strong>{" "}
                      <span className="text-ink/40">(overrides statutory)</span>
                    </span>
                  </div>
                )}
                {data.collectiveAgreement.maxWeeklyHours && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-forest text-xs" />
                    <span>
                      Weekly max:{" "}
                      <strong>{data.collectiveAgreement.maxWeeklyHours}h</strong>
                    </span>
                  </div>
                )}
                {data.collectiveAgreement.minDailyRest && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-forest text-xs" />
                    <span>
                      Daily rest:{" "}
                      <strong>{data.collectiveAgreement.minDailyRest}h</strong>{" "}
                      minimum
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <i
                    className={`fas ${data.collectiveAgreement.nightWorkAllowed ? "fa-check-circle text-forest" : "fa-times-circle text-terracotta"} text-xs`}
                  />
                  <span>
                    Night work:{" "}
                    <strong>
                      {data.collectiveAgreement.nightWorkAllowed ? "Allowed" : "Not allowed"}
                    </strong>
                  </span>
                </div>
                {data.collectiveAgreement.sector && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-building text-ocean text-xs" />
                    <span>
                      Sector: <strong>{data.collectiveAgreement.sector}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
              <i className="fas fa-handshake text-2xl text-stone/40" />
            </div>
            <p className="text-ink/60 font-medium mb-1">No collective agreement configured</p>
            <p className="text-ink/40 text-sm mb-4">
              Configure a collective agreement to override default labor law limits
            </p>
            <a
              href="/dashboard/settings"
              className="text-sm text-ocean hover:text-ocean/70 font-medium flex items-center gap-1"
            >
              Go to Settings
              <i className="fas fa-arrow-right text-xs" />
            </a>
          </div>
        )}
      </section>

      {/* ── Section 7: Audit Log ─────────────────────────────────────────────── */}
      <section className="relative bg-white rounded-2xl p-6 border border-stone/50 overflow-hidden animate-fade-up delay-7">
        <div
          className="warm-orb w-[300px] h-[300px] -bottom-32 -right-24"
          style={{
            background: "linear-gradient(135deg, #2d5a4a, #3a6b7c)",
            opacity: 0.06,
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-stone/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-clipboard-list text-ink/60" />
            </div>
            <div>
              <h2 className="font-display text-xl">{d.recentAuditLog}</h2>
              <p className="text-ink/50 text-sm">All schedule changes logged automatically</p>
            </div>
          </div>

          {data.auditLogEntries.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="relative w-full max-w-md">
                <div className="absolute left-6 top-0 bottom-0 w-px border-l-2 border-dashed border-stone/30" />
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`relative flex items-center gap-4 mb-6 last:mb-0 animate-fade-up delay-${Math.min(i + 6, 8)}`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-stone/30 flex items-center justify-center bg-stone/5 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-stone/20" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-stone/10 rounded-full w-3/4 mb-1.5" />
                      <div className="h-2 bg-stone/5 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="text-ink/50 font-medium">{d.noComplianceEvents}</p>
                <p className="text-sm text-ink/40 mt-1 max-w-sm">{d.auditLogAutomatic}</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px border-l-2 border-dashed border-stone/30" />
              <div className="space-y-4">
                {data.auditLogEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`relative flex items-start gap-4 animate-fade-up delay-${Math.min(i + 4, 8)}`}
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-stone/30 flex items-center justify-center bg-stone/5 shrink-0">
                      <i className="fas fa-shield-alt text-xs text-stone/60" />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {entry.action.replace(/_/g, " ")}
                          <span className="ml-2 text-xs text-ink/40 font-normal">
                            {entry.entityType}
                          </span>
                        </p>
                        <span className="text-xs text-ink/40 shrink-0 ml-4">
                          {entry.timestamp.toLocaleDateString(locale, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {entry.userEmail && (
                        <p className="text-xs text-ink/50 mt-0.5">{entry.userEmail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
