/**
 * Night Work Detection - EU Working Time Directive Art 8-12
 *
 * Night workers cannot exceed 8 hours per 24h on average.
 * Night worker = works 3+ hours during night window on 6+ days/month.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NightWindow {
  /** Hour (0-23) when the night period begins */
  start: number;
  /** Hour (0-23) when the night period ends (next day if start > end) */
  end: number;
}

export interface Shift {
  id: string;
  startTime: Date;
  endTime: Date;
}

export interface NightWorkViolation {
  type: "NIGHT_HOURS_EXCEEDED";
  severity: "ERROR";
  message: string;
  windowStart: Date;
  windowEnd: Date;
  nightHours: number;
  maxNightHours: number;
}

export interface NightWorkStats {
  nightShiftCount: number;
  avgNightHoursPerShift: number;
  isNightWorker: boolean;
  maxNightHours: number;
  violations: NightWorkViolation[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Night windows per country code (EU WTD Art 2(3) and national laws) */
const NIGHT_WINDOWS: Record<string, NightWindow> = {
  NO: { start: 21, end: 6 },   // AML §10-11: 21:00-06:00
  SE: { start: 22, end: 6 },   // Arbetstidslagen §13
  DK: { start: 23, end: 6 },   // Typical collective agreement
  FI: { start: 23, end: 6 },   // Työaikalaki §26
  DE: { start: 23, end: 6 },   // ArbZG §2
  AT: { start: 22, end: 5 },   // AZG §12a
  CH: { start: 23, end: 6 },   // ArGV 1
  FR: { start: 21, end: 6 },   // Code du Travail L3122-2
  BE: { start: 20, end: 6 },   // Loi sur le travail
  NL: { start: 0, end: 6 },    // ATW (midnight to 6am counts)
  ES: { start: 22, end: 6 },   // ET Art 36
  PT: { start: 20, end: 7 },   // CT Art 223
  IT: { start: 22, end: 6 },   // D.Lgs 66/2003
  PL: { start: 21, end: 7 },   // KP Art 1517
  GB: { start: 23, end: 6 },   // WTR 1998
  IE: { start: 23, end: 6 },   // Organisation of Working Time Act
  DEFAULT: { start: 23, end: 6 }, // EU WTD Article 2(3)
};

/** Max night hours per 24h (EU WTD Art 8) */
const MAX_NIGHT_HOURS_PER_24H = 8;

/** Night worker threshold: 3+ hours of night work regularly (EU WTD Art 2(4)) */
const NIGHT_WORKER_THRESHOLD_HOURS = 3;

/** Night worker classification: 3h+ of night work on 6+ days/month */
const NIGHT_WORKER_DAYS_PER_MONTH = 6;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the night window for the given country code.
 * Falls back to DEFAULT if the country code is not recognised.
 */
export function getNightWindow(countryCode: string): NightWindow {
  return NIGHT_WINDOWS[countryCode.toUpperCase()] ?? NIGHT_WINDOWS["DEFAULT"]!;
}

/**
 * Calculates how many hours of a given shift fall within the night window.
 *
 * The night window may span midnight (e.g. 21:00–06:00 next day). The shift
 * itself may also cross midnight. We split each day's worth of the shift into
 * 1-minute slots and count those falling inside the night window, then convert
 * to hours. This approach handles all edge cases without complex arithmetic.
 *
 * Performance note: shifts are usually ≤ 24 h, so ≤ 1 440 iterations.
 */
export function calculateNightHours(
  shift: { startTime: Date; endTime: Date },
  countryCode: string
): number {
  const window = getNightWindow(countryCode);
  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);

  if (end <= start) return 0;

  const totalMinutes = (end.getTime() - start.getTime()) / 60_000;
  let nightMinutes = 0;

  for (let m = 0; m < totalMinutes; m++) {
    const minute = new Date(start.getTime() + m * 60_000);
    const hour = minute.getHours();

    const inNight =
      window.start < window.end
        ? // Same-day window (e.g. NL: 00:00-06:00)
          hour >= window.start && hour < window.end
        : // Overnight window (e.g. NO: 21:00-06:00 next day)
          hour >= window.start || hour < window.end;

    if (inNight) nightMinutes++;
  }

  return nightMinutes / 60;
}

/**
 * Returns true when the employee qualifies as a "night worker".
 *
 * EU WTD Art 2(4): a night worker is one who normally works at least 3 hours
 * during the night period, or who works night hours on a significant proportion
 * of annual working time. We use the practical threshold of 3h+ on 6+ days
 * within any rolling month of the supplied shift list.
 */
export function isNightWorker(shifts: Shift[], countryCode: string): boolean {
  // Group shifts by calendar month
  const monthGroups = new Map<string, Shift[]>();

  for (const shift of shifts) {
    const d = new Date(shift.startTime);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const group = monthGroups.get(key) ?? [];
    group.push(shift);
    monthGroups.set(key, group);
  }

  for (const monthShifts of monthGroups.values()) {
    let qualifyingDays = 0;

    for (const shift of monthShifts) {
      const nightHours = calculateNightHours(shift, countryCode);
      if (nightHours >= NIGHT_WORKER_THRESHOLD_HOURS) {
        qualifyingDays++;
      }
    }

    if (qualifyingDays >= NIGHT_WORKER_DAYS_PER_MONTH) {
      return true;
    }
  }

  return false;
}

/**
 * Checks the 8h/24h rolling limit for night workers (EU WTD Art 8).
 *
 * For each shift that has any night hours we look at all other shifts whose
 * night period starts within ±24 h of that shift's night period start, sum
 * the night hours in that 24-hour window, and flag if the total exceeds
 * MAX_NIGHT_HOURS_PER_24H.
 *
 * Only reports violations when the employee qualifies as a night worker.
 */
export function checkNightWorkLimit(
  shifts: Shift[],
  countryCode: string
): NightWorkViolation[] {
  if (!isNightWorker(shifts, countryCode)) return [];

  const violations: NightWorkViolation[] = [];
  const sorted = [...shifts].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const anchor = sorted[i]!;
    const anchorNight = calculateNightHours(anchor, countryCode);
    if (anchorNight === 0) continue;

    const windowStart = new Date(anchor.startTime);
    const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);

    let totalNightHoursIn24h = 0;

    for (const shift of sorted) {
      const shiftStart = new Date(shift.startTime);
      const shiftEnd = new Date(shift.endTime);

      // Shift overlaps the 24-hour window starting at anchor.startTime
      if (shiftEnd > windowStart && shiftStart < windowEnd) {
        // Clamp the shift to the 24h window before calculating night hours
        const clampedStart = shiftStart < windowStart ? windowStart : shiftStart;
        const clampedEnd = shiftEnd > windowEnd ? windowEnd : shiftEnd;
        totalNightHoursIn24h += calculateNightHours(
          { startTime: clampedStart, endTime: clampedEnd },
          countryCode
        );
      }
    }

    if (totalNightHoursIn24h > MAX_NIGHT_HOURS_PER_24H) {
      violations.push({
        type: "NIGHT_HOURS_EXCEEDED",
        severity: "ERROR",
        message: `Night work exceeds ${MAX_NIGHT_HOURS_PER_24H}h in 24-hour window (${totalNightHoursIn24h.toFixed(1)}h)`,
        windowStart,
        windowEnd,
        nightHours: totalNightHoursIn24h,
        maxNightHours: MAX_NIGHT_HOURS_PER_24H,
      });
    }
  }

  // Deduplicate: keep only one violation per unique windowStart
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = v.windowStart.toISOString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Returns aggregated night work statistics for a set of shifts.
 */
export function getNightWorkStats(
  shifts: Shift[],
  countryCode: string
): NightWorkStats {
  const nightShifts = shifts.filter(
    (s) => calculateNightHours(s, countryCode) > 0
  );

  const totalNightHours = nightShifts.reduce(
    (sum, s) => sum + calculateNightHours(s, countryCode),
    0
  );

  const avgNightHoursPerShift =
    nightShifts.length > 0 ? totalNightHours / nightShifts.length : 0;

  const maxNightHours =
    nightShifts.length > 0
      ? Math.max(...nightShifts.map((s) => calculateNightHours(s, countryCode)))
      : 0;

  return {
    nightShiftCount: nightShifts.length,
    avgNightHoursPerShift,
    isNightWorker: isNightWorker(shifts, countryCode),
    maxNightHours,
    violations: checkNightWorkLimit(shifts, countryCode),
  };
}
