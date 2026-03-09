/**
 * Protected Worker Compliance - EU Directives 94/33/EC, 92/85/EEC, 2003/88/EC
 *
 * Validates scheduling rules for:
 * - Young workers (under 18): restricted hours, no night work, mandatory breaks
 * - Pregnant/nursing workers: no compulsory night work
 * - WTD 48h opt-out: individual opt-out tracking (UK/IE and optionally others)
 */

import { calculateNightHours, getNightWindow } from "./night-work";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface YoungWorkerRules {
  maxDailyHours: number;
  maxWeeklyHours: number;
  noNightWork: boolean;
  nightWindowStart: number; // Hour, e.g. 20 for 20:00
  nightWindowEnd: number;   // Hour, e.g. 6 for 06:00
  breakAfterHours: number;  // Usually 4.5
  breakMinutes: number;     // Usually 30
  minAge: number;           // Minimum working age
}

export interface ProtectedWorkerViolation {
  type:
    | "YOUNG_WORKER_DAILY_HOURS"
    | "YOUNG_WORKER_WEEKLY_HOURS"
    | "YOUNG_WORKER_NIGHT_WORK"
    | "YOUNG_WORKER_BREAK_REQUIRED"
    | "YOUNG_WORKER_UNDERAGE"
    | "PREGNANT_NIGHT_WORK"
    | "NURSING_NIGHT_WORK";
  severity: "ERROR" | "WARN";
  message: string;
  shiftId?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Young worker rules per country code.
 * EU Directive 94/33/EC sets the baseline; national laws may be stricter.
 */
export const YOUNG_WORKER_RULES: Record<string, YoungWorkerRules> = {
  NO: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 21,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  SE: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 22,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 16,
  },
  DK: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  DE: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  FR: {
    maxDailyHours: 8,
    maxWeeklyHours: 35,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 16,
  },
  FI: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 22,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  AT: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  CH: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  NL: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  BE: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  ES: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 22,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 16,
  },
  PT: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 7,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 16,
  },
  IT: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 22,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  PL: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
  GB: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 22,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 16,
  },
  IE: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 22,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 16,
  },
  DEFAULT: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    noNightWork: true,
    nightWindowStart: 20,
    nightWindowEnd: 6,
    breakAfterHours: 4.5,
    breakMinutes: 30,
    minAge: 15,
  },
};

/**
 * Countries that allow individual opt-out from the WTD 48h weekly average.
 * UK and IE allow it by default; some other countries may allow it via CBA.
 */
const WTD_OPT_OUT_COUNTRIES = new Set(["GB", "IE"]);

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns young worker rules for the given country code.
 * Falls back to DEFAULT if the country code is not recognised.
 */
export function getYoungWorkerRules(countryCode: string): YoungWorkerRules {
  return (
    YOUNG_WORKER_RULES[countryCode.toUpperCase()] ??
    YOUNG_WORKER_RULES["DEFAULT"]!
  );
}

/**
 * Calculates a person's age in whole years from their date of birth.
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Returns true if the person is a young worker (under 18).
 * Returns false if dateOfBirth is null/undefined (cannot determine).
 */
export function isYoungWorker(
  dateOfBirth: Date | null | undefined
): boolean {
  if (!dateOfBirth) return false;
  return calculateAge(dateOfBirth) < 18;
}

/**
 * Checks a single shift for young worker compliance violations.
 *
 * Returns an array of violations for:
 * - Daily hours exceeded (max 8h for young workers)
 * - Night work assigned (prohibited for young workers)
 * - Insufficient break (must break after 4.5h continuous work)
 * - Underage (below minimum working age)
 */
export function checkYoungWorkerCompliance(
  shift: { id?: string; startTime: Date; endTime: Date; breakMinutes: number },
  dateOfBirth: Date,
  countryCode: string
): ProtectedWorkerViolation[] {
  const violations: ProtectedWorkerViolation[] = [];
  const rules = getYoungWorkerRules(countryCode);
  const age = calculateAge(dateOfBirth);

  // Check minimum age
  if (age < rules.minAge) {
    violations.push({
      type: "YOUNG_WORKER_UNDERAGE",
      severity: "ERROR",
      message: `Employee is ${age} years old, below minimum working age of ${rules.minAge}`,
      shiftId: shift.id,
    });
  }

  // Calculate working hours (gross minus break)
  const durationMs =
    new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime();
  const grossHours = durationMs / (1000 * 60 * 60);
  const netHours = grossHours - shift.breakMinutes / 60;

  // Check daily hours limit
  if (netHours > rules.maxDailyHours) {
    violations.push({
      type: "YOUNG_WORKER_DAILY_HOURS",
      severity: "ERROR",
      message: `Young worker shift is ${netHours.toFixed(1)}h (net), exceeding ${rules.maxDailyHours}h daily limit`,
      shiftId: shift.id,
    });
  }

  // Check night work prohibition
  if (rules.noNightWork) {
    const nightHours = calculateNightHoursForYoungWorker(shift, rules);
    if (nightHours > 0) {
      violations.push({
        type: "YOUNG_WORKER_NIGHT_WORK",
        severity: "ERROR",
        message: `Young worker assigned ${nightHours.toFixed(1)}h of night work (${rules.nightWindowStart}:00-${String(rules.nightWindowEnd).padStart(2, "0")}:00)`,
        shiftId: shift.id,
      });
    }
  }

  // Check break requirement (4.5h continuous work requires 30min break)
  if (grossHours > rules.breakAfterHours && shift.breakMinutes < rules.breakMinutes) {
    violations.push({
      type: "YOUNG_WORKER_BREAK_REQUIRED",
      severity: "ERROR",
      message: `Young worker needs ${rules.breakMinutes}min break after ${rules.breakAfterHours}h; only ${shift.breakMinutes}min recorded`,
      shiftId: shift.id,
    });
  }

  return violations;
}

/**
 * Checks weekly hours for a young worker across multiple shifts.
 * Groups shifts by ISO week and checks against the weekly limit.
 */
export function checkYoungWorkerWeeklyHours(
  shifts: Array<{ id?: string; startTime: Date; endTime: Date; breakMinutes: number }>,
  countryCode: string
): ProtectedWorkerViolation[] {
  const rules = getYoungWorkerRules(countryCode);
  const violations: ProtectedWorkerViolation[] = [];

  // Group shifts by ISO week
  const weekMap = new Map<string, number>();
  for (const shift of shifts) {
    const start = new Date(shift.startTime);
    // Get ISO week key
    const weekStart = getMonday(start);
    const weekKey = weekStart.toISOString().slice(0, 10);

    const durationMs =
      new Date(shift.endTime).getTime() - start.getTime();
    const netHours = durationMs / (1000 * 60 * 60) - shift.breakMinutes / 60;

    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + netHours);
  }

  for (const [weekKey, hours] of weekMap) {
    if (hours > rules.maxWeeklyHours) {
      violations.push({
        type: "YOUNG_WORKER_WEEKLY_HOURS",
        severity: "ERROR",
        message: `Young worker has ${hours.toFixed(1)}h in week of ${weekKey}, exceeding ${rules.maxWeeklyHours}h weekly limit`,
      });
    }
  }

  return violations;
}

/**
 * Returns true if a pregnant or nursing worker is assigned to a shift
 * that includes night hours. EU Directive 92/85/EEC prohibits compulsory
 * night work for pregnant and nursing workers.
 */
export function isPregnantNightWorkViolation(
  shift: { startTime: Date; endTime: Date },
  isPregnant: boolean,
  countryCode: string
): boolean {
  if (!isPregnant) return false;
  const nightHours = calculateNightHours(shift, countryCode);
  return nightHours > 0;
}

/**
 * Checks a shift for pregnant/nursing worker night work violations.
 * Returns violations for both pregnant and nursing mother flags.
 */
export function checkPregnantWorkerCompliance(
  shift: { id?: string; startTime: Date; endTime: Date },
  isPregnant: boolean,
  isNursingMother: boolean,
  countryCode: string
): ProtectedWorkerViolation[] {
  const violations: ProtectedWorkerViolation[] = [];
  const nightHours = calculateNightHours(shift, countryCode);

  if (nightHours > 0 && isPregnant) {
    const window = getNightWindow(countryCode);
    violations.push({
      type: "PREGNANT_NIGHT_WORK",
      severity: "ERROR",
      message: `Pregnant worker assigned ${nightHours.toFixed(1)}h of night work (${window.start}:00-${String(window.end).padStart(2, "0")}:00)`,
      shiftId: shift.id,
    });
  }

  if (nightHours > 0 && isNursingMother) {
    const window = getNightWindow(countryCode);
    violations.push({
      type: "NURSING_NIGHT_WORK",
      severity: "ERROR",
      message: `Nursing mother assigned ${nightHours.toFixed(1)}h of night work (${window.start}:00-${String(window.end).padStart(2, "0")}:00)`,
      shiftId: shift.id,
    });
  }

  return violations;
}

/**
 * Returns true if an employee can exceed the 48h weekly average limit.
 *
 * Only returns true when:
 * 1. The country allows individual opt-out from the WTD 48h rule (UK, IE)
 * 2. The employee has personally opted out (wtdOptOut = true)
 */
export function canExceed48hAverage(
  wtdOptOut: boolean,
  countryCode: string
): boolean {
  if (!WTD_OPT_OUT_COUNTRIES.has(countryCode.toUpperCase())) return false;
  return wtdOptOut === true;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Calculate night hours using young worker-specific night windows,
 * which are typically wider than the general night worker windows.
 */
function calculateNightHoursForYoungWorker(
  shift: { startTime: Date; endTime: Date },
  rules: YoungWorkerRules
): number {
  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);

  if (end <= start) return 0;

  const totalMinutes = (end.getTime() - start.getTime()) / 60_000;
  let nightMinutes = 0;

  for (let m = 0; m < totalMinutes; m++) {
    const minute = new Date(start.getTime() + m * 60_000);
    const hour = minute.getHours();

    const inNight =
      rules.nightWindowStart < rules.nightWindowEnd
        ? hour >= rules.nightWindowStart && hour < rules.nightWindowEnd
        : hour >= rules.nightWindowStart || hour < rules.nightWindowEnd;

    if (inNight) nightMinutes++;
  }

  return nightMinutes / 60;
}

/**
 * Returns the Monday (start of ISO week) for a given date.
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
