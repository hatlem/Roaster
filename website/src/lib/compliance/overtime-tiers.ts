import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  startOfYear,
  subWeeks,
  startOfQuarter,
  differenceInHours,
  eachWeekOfInterval,
} from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OvertimeTiers {
  weeklyMaxOT: number | null;
  fourWeekMaxOT: number | null;
  monthlyMaxOT: number | null;
  quarterlyMaxOT: number | null;
  fourMonthMaxOT: number | null;
  yearlyMaxOT: number | null;
  dailyMaxOT: number | null;
  refPeriodWeeks: number | null;
  avgWeeklyMaxIncOT: number | null;
}

export interface Shift {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
}

export interface OvertimeAccumulation {
  userId: string;
  weeklyOT: number;
  fourWeekOT: number;
  monthlyOT: number;
  quarterlyOT: number;
  fourMonthOT: number;
  yearlyOT: number;
  dailyMaxOT: number;
  refPeriodAvgWeekly: number | null;
  maxWeeklyHours: number;
}

export interface OvertimeTierViolation {
  tier: "daily" | "weekly" | "4week" | "monthly" | "quarterly" | "4month" | "yearly" | "reference";
  current: number;
  limit: number;
  severity: "ERROR" | "WARNING";
}

export interface OvertimeTierUtilization {
  daily: number | null;
  weekly: number | null;
  fourWeek: number | null;
  monthly: number | null;
  quarterly: number | null;
  fourMonth: number | null;
  yearly: number | null;
  reference: number | null;
}

// ─── Per-country tier definitions ────────────────────────────────────────────

const OVERTIME_TIERS: Record<string, OvertimeTiers> = {
  NO: {
    weeklyMaxOT: 10,
    fourWeekMaxOT: 25,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: 200,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  SE: {
    weeklyMaxOT: null,
    fourWeekMaxOT: 48,
    monthlyMaxOT: 50,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: 200,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  DK: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: null,
    dailyMaxOT: null,
    refPeriodWeeks: 17,
    avgWeeklyMaxIncOT: 48,
  },
  FI: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: 138,
    yearlyMaxOT: 250,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  DE: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: null,
    dailyMaxOT: null,
    refPeriodWeeks: 26,
    avgWeeklyMaxIncOT: 48,
  },
  FR: {
    weeklyMaxOT: 8,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: 220,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  NL: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: null,
    dailyMaxOT: null,
    refPeriodWeeks: 13,
    avgWeeklyMaxIncOT: 48,
  },
  BE: {
    weeklyMaxOT: 11,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: 65,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  AT: {
    weeklyMaxOT: 10,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: 80,
    fourMonthMaxOT: null,
    yearlyMaxOT: 200,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  CH: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: 170,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  ES: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: 80,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  PT: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: 150,
    dailyMaxOT: 2,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  IT: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: 250,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  PL: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: 48,
    fourMonthMaxOT: null,
    yearlyMaxOT: 150,
    dailyMaxOT: null,
    refPeriodWeeks: null,
    avgWeeklyMaxIncOT: null,
  },
  GB: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: null,
    dailyMaxOT: null,
    refPeriodWeeks: 17,
    avgWeeklyMaxIncOT: 48,
  },
  IE: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: null,
    dailyMaxOT: null,
    refPeriodWeeks: 17,
    avgWeeklyMaxIncOT: 48,
  },
  EU_DEFAULT: {
    weeklyMaxOT: null,
    fourWeekMaxOT: null,
    monthlyMaxOT: null,
    quarterlyMaxOT: null,
    fourMonthMaxOT: null,
    yearlyMaxOT: null,
    dailyMaxOT: null,
    refPeriodWeeks: 17,
    avgWeeklyMaxIncOT: 48,
  },
};

const DEFAULT_MAX_WEEKLY_HOURS = 40;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the overtime tier configuration for a given country code.
 * Falls back to EU_DEFAULT if the country is not explicitly listed.
 */
export function getOvertimeTiers(countryCode: string): OvertimeTiers {
  return OVERTIME_TIERS[countryCode.toUpperCase()] ?? OVERTIME_TIERS["EU_DEFAULT"];
}

/**
 * Calculates overtime accumulation across multiple periods for a single user.
 * The `shifts` array must already be filtered to the target user for the current year.
 */
export function calculateOvertimeHours(
  shifts: Shift[],
  userId: string,
  maxWeeklyHours: number = DEFAULT_MAX_WEEKLY_HOURS
): OvertimeAccumulation {
  const now = new Date();
  const userShifts = shifts.filter((s) => s.userId === userId);

  // ── Helper: shift net hours ──────────────────────────────────────────────
  const shiftHours = (s: Shift): number =>
    Math.max(
      0,
      (s.endTime.getTime() - s.startTime.getTime()) / 3600000 - s.breakMinutes / 60
    );

  // ── Helper: OT for a single shift ─────────────────────────────────────────
  // Build weekly totals map first so we can compute per-week OT
  const weeklyTotals = new Map<string, number>();
  for (const s of userShifts) {
    const key = startOfWeek(s.startTime, { weekStartsOn: 1 }).toISOString();
    weeklyTotals.set(key, (weeklyTotals.get(key) ?? 0) + shiftHours(s));
  }

  const weeklyOTMap = new Map<string, number>();
  for (const [key, total] of weeklyTotals) {
    weeklyOTMap.set(key, Math.max(0, total - maxWeeklyHours));
  }

  // ── Current week OT ───────────────────────────────────────────────────────
  const currentWeekKey = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weeklyOT = weeklyOTMap.get(currentWeekKey) ?? 0;

  // ── 4-week rolling OT ─────────────────────────────────────────────────────
  const fourWeeksAgo = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 3);
  let fourWeekOT = 0;
  for (const [key, ot] of weeklyOTMap) {
    const weekStart = new Date(key);
    if (weekStart >= fourWeeksAgo) {
      fourWeekOT += ot;
    }
  }

  // ── Monthly OT (calendar month) ───────────────────────────────────────────
  const monthStart = startOfMonth(now);
  let monthlyOT = 0;
  for (const [key, ot] of weeklyOTMap) {
    const weekStart = new Date(key);
    // Include weeks that START within current month
    if (weekStart >= monthStart) {
      monthlyOT += ot;
    }
  }

  // ── Quarterly OT ──────────────────────────────────────────────────────────
  const quarterStart = startOfQuarter(now);
  let quarterlyOT = 0;
  for (const [key, ot] of weeklyOTMap) {
    const weekStart = new Date(key);
    if (weekStart >= quarterStart) {
      quarterlyOT += ot;
    }
  }

  // ── 4-month OT (rolling from 4 months ago) ────────────────────────────────
  const fourMonthsAgo = new Date(now);
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
  let fourMonthOT = 0;
  for (const s of userShifts) {
    if (s.startTime >= fourMonthsAgo) {
      const weekKey = startOfWeek(s.startTime, { weekStartsOn: 1 }).toISOString();
      const weekTotal = weeklyTotals.get(weekKey) ?? 0;
      // Avoid double-counting — only sum at week boundary
      if (s.startTime.getTime() === new Date(weekKey).getTime()) {
        fourMonthOT += Math.max(0, weekTotal - maxWeeklyHours);
      }
    }
  }
  // Simpler approach: aggregate distinct weeks within 4-month window
  fourMonthOT = 0;
  for (const [key, ot] of weeklyOTMap) {
    const weekStart = new Date(key);
    if (weekStart >= fourMonthsAgo) {
      fourMonthOT += ot;
    }
  }

  // ── Yearly OT (Jan 1 – now) ───────────────────────────────────────────────
  const yearStart = startOfYear(now);
  let yearlyOT = 0;
  for (const [key, ot] of weeklyOTMap) {
    const weekStart = new Date(key);
    if (weekStart >= yearStart) {
      yearlyOT += ot;
    }
  }

  // ── Daily max OT (for countries like PT) ─────────────────────────────────
  // Find the single worst day's OT contribution
  const dailyTotals = new Map<string, number>();
  for (const s of userShifts) {
    const dayKey = s.startTime.toISOString().slice(0, 10);
    dailyTotals.set(dayKey, (dailyTotals.get(dayKey) ?? 0) + shiftHours(s));
  }
  let dailyMaxOT = 0;
  for (const total of dailyTotals.values()) {
    const dayOT = Math.max(0, total - maxWeeklyHours / 5); // assume 8h normal day
    if (dayOT > dailyMaxOT) dailyMaxOT = dayOT;
  }

  // ── Reference period average weekly total (EU WTD) ────────────────────────
  // Not OT specifically — average TOTAL weekly hours over the ref period
  // This is checked against avgWeeklyMaxIncOT (e.g. 48h)
  // We compute this from all shifts in the userShifts array (assumed to be YTD)
  let refPeriodAvgWeekly: number | null = null;
  // We always compute it; the caller decides whether to use it based on tiers
  const allWeekStarts = eachWeekOfInterval(
    { start: yearStart, end: now },
    { weekStartsOn: 1 }
  );
  if (allWeekStarts.length > 0) {
    const totalHoursInYear = Array.from(weeklyTotals.values()).reduce((a, b) => a + b, 0);
    refPeriodAvgWeekly = totalHoursInYear / allWeekStarts.length;
  }

  return {
    userId,
    weeklyOT,
    fourWeekOT,
    monthlyOT,
    quarterlyOT,
    fourMonthOT,
    yearlyOT,
    dailyMaxOT,
    refPeriodAvgWeekly,
    maxWeeklyHours,
  };
}

/**
 * Checks an accumulation object against country-specific overtime tiers.
 * Returns an array of violations (may be empty if compliant).
 */
export function checkOvertimeTiers(
  accumulation: OvertimeAccumulation,
  tiers: OvertimeTiers,
  _countryCode: string
): OvertimeTierViolation[] {
  const violations: OvertimeTierViolation[] = [];

  const check = (
    tier: OvertimeTierViolation["tier"],
    current: number,
    limit: number | null
  ) => {
    if (limit === null) return;
    if (current > limit) {
      violations.push({ tier, current, limit, severity: "ERROR" });
    } else if (current > limit * 0.8) {
      violations.push({ tier, current, limit, severity: "WARNING" });
    }
  };

  check("weekly", accumulation.weeklyOT, tiers.weeklyMaxOT);
  check("4week", accumulation.fourWeekOT, tiers.fourWeekMaxOT);
  check("monthly", accumulation.monthlyOT, tiers.monthlyMaxOT);
  check("quarterly", accumulation.quarterlyOT, tiers.quarterlyMaxOT);
  check("4month", accumulation.fourMonthOT, tiers.fourMonthMaxOT);
  check("yearly", accumulation.yearlyOT, tiers.yearlyMaxOT);

  if (tiers.dailyMaxOT !== null) {
    check("daily", accumulation.dailyMaxOT, tiers.dailyMaxOT);
  }

  // Reference period average (EU WTD): checks avg total weekly hours, not OT
  if (
    tiers.refPeriodWeeks !== null &&
    tiers.avgWeeklyMaxIncOT !== null &&
    accumulation.refPeriodAvgWeekly !== null
  ) {
    check("reference", accumulation.refPeriodAvgWeekly, tiers.avgWeeklyMaxIncOT);
  }

  return violations;
}

/**
 * Returns per-tier utilization percentages (0–100+) for progress bars.
 * A null value means the tier is not applicable for this country.
 */
export function getOvertimeUtilization(
  accumulation: OvertimeAccumulation,
  tiers: OvertimeTiers
): OvertimeTierUtilization {
  const pct = (current: number, limit: number | null): number | null =>
    limit !== null ? Math.round((current / limit) * 100) : null;

  return {
    daily: pct(accumulation.dailyMaxOT, tiers.dailyMaxOT),
    weekly: pct(accumulation.weeklyOT, tiers.weeklyMaxOT),
    fourWeek: pct(accumulation.fourWeekOT, tiers.fourWeekMaxOT),
    monthly: pct(accumulation.monthlyOT, tiers.monthlyMaxOT),
    quarterly: pct(accumulation.quarterlyOT, tiers.quarterlyMaxOT),
    fourMonth: pct(accumulation.fourMonthOT, tiers.fourMonthMaxOT),
    yearly: pct(accumulation.yearlyOT, tiers.yearlyMaxOT),
    reference:
      tiers.refPeriodWeeks !== null &&
      tiers.avgWeeklyMaxIncOT !== null &&
      accumulation.refPeriodAvgWeekly !== null
        ? pct(accumulation.refPeriodAvgWeekly, tiers.avgWeeklyMaxIncOT)
        : null,
  };
}
