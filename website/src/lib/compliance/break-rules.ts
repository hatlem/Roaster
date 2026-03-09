/**
 * Mandatory Break Rules - EU Working Time Directive Art 4
 *
 * Employees must have a break after a specified number of consecutive hours.
 * Thresholds and required break durations vary by country.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BreakRule {
  /** Shift duration (hours) that triggers the mandatory break */
  triggerHours: number;
  /** Minimum break duration in minutes */
  breakMinutes: number;
  /** Whether the break must be paid */
  paidBreak: boolean;
}

export interface BreakInterval {
  start: Date;
  end: Date;
}

export interface BreakViolation {
  type: "BREAK_NOT_RECORDED" | "INSUFFICIENT_BREAK" | "BREAK_REQUIRED";
  severity: "WARN" | "ERROR";
  message: string;
  requiredBreakMinutes: number;
  actualBreakMinutes: number;
}

export interface BreakSummary {
  shiftsRequiringBreak: number;
  shiftsWithBreakRecorded: number;
  compliancePercent: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Break rules per country code (national labour laws) */
const BREAK_RULES: Record<string, BreakRule> = {
  NO: { triggerHours: 5.5, breakMinutes: 30, paidBreak: false },   // AML §10-9
  SE: { triggerHours: 5.0, breakMinutes: 30, paidBreak: false },   // ATL §15
  DK: { triggerHours: 6.0, breakMinutes: 30, paidBreak: false },   // Typical CBA
  FI: { triggerHours: 6.0, breakMinutes: 30, paidBreak: false },   // Työaikalaki §28
  DE: { triggerHours: 6.0, breakMinutes: 30, paidBreak: false },   // ArbZG §4 (45min if >9h)
  AT: { triggerHours: 6.0, breakMinutes: 30, paidBreak: false },   // AZG §11
  CH: { triggerHours: 5.5, breakMinutes: 15, paidBreak: true },    // ArGV 1
  FR: { triggerHours: 6.0, breakMinutes: 20, paidBreak: false },   // CT L3121-16
  BE: { triggerHours: 6.0, breakMinutes: 15, paidBreak: false },   // Loi 16 mars 1971
  NL: { triggerHours: 5.5, breakMinutes: 30, paidBreak: false },   // ATW Art 8.3
  ES: { triggerHours: 6.0, breakMinutes: 15, paidBreak: false },   // ET Art 34.4
  PT: { triggerHours: 5.0, breakMinutes: 30, paidBreak: false },   // CT Art 213
  IT: { triggerHours: 6.0, breakMinutes: 10, paidBreak: false },   // D.Lgs 66/2003
  PL: { triggerHours: 6.0, breakMinutes: 15, paidBreak: false },   // KP Art 134
  GB: { triggerHours: 6.0, breakMinutes: 20, paidBreak: false },   // WTR 1998 Reg 12
  IE: { triggerHours: 6.0, breakMinutes: 15, paidBreak: false },   // OWTA 1997 S12
  DEFAULT: { triggerHours: 6.0, breakMinutes: 20, paidBreak: false }, // EU WTD Art 4
};

/**
 * Germany-specific: 45 minutes required for shifts exceeding 9 hours.
 * ArbZG §4
 */
const DE_EXTENDED_TRIGGER_HOURS = 9;
const DE_EXTENDED_BREAK_MINUTES = 45;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the break rule for the given country code.
 * Falls back to DEFAULT if the country code is not recognised.
 */
export function getBreakRule(countryCode: string): BreakRule {
  return BREAK_RULES[countryCode.toUpperCase()] ?? BREAK_RULES["DEFAULT"]!;
}

/**
 * Returns true when a shift of the given duration requires a mandatory break.
 */
export function requiresBreak(
  shiftDurationHours: number,
  countryCode: string
): boolean {
  const rule = getBreakRule(countryCode);
  return shiftDurationHours > rule.triggerHours;
}

/**
 * Returns the required break duration in minutes for the given shift length.
 *
 * Germany special case: 45 min for shifts > 9h (ArbZG §4).
 */
export function getRequiredBreakMinutes(
  shiftDurationHours: number,
  countryCode: string
): number {
  const rule = getBreakRule(countryCode);

  if (!requiresBreak(shiftDurationHours, countryCode)) return 0;

  if (countryCode.toUpperCase() === "DE") {
    if (shiftDurationHours > DE_EXTENDED_TRIGGER_HOURS) {
      return DE_EXTENDED_BREAK_MINUTES;
    }
  }

  return rule.breakMinutes;
}

/**
 * Checks whether a shift is compliant with mandatory break rules.
 *
 * If no break data is available (empty array), the shift is flagged as
 * "break not recorded" with severity WARN rather than ERROR, because break
 * recording is not yet tracked in the schema.
 *
 * Returns null when no break is required for the shift duration.
 */
export function checkBreakCompliance(
  shift: { startTime: Date; endTime: Date },
  breaks: BreakInterval[],
  countryCode: string
): BreakViolation | null {
  const durationMs =
    new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  if (!requiresBreak(durationHours, countryCode)) return null;

  const requiredBreakMinutes = getRequiredBreakMinutes(
    durationHours,
    countryCode
  );

  // No break data recorded — flag as WARN (no schema support yet)
  if (breaks.length === 0) {
    return {
      type: "BREAK_NOT_RECORDED",
      severity: "WARN",
      message: `Break not recorded — ${requiredBreakMinutes} min break required for ${durationHours.toFixed(1)}h shift`,
      requiredBreakMinutes,
      actualBreakMinutes: 0,
    };
  }

  // Sum break minutes that fall inside the shift window
  const shiftStart = new Date(shift.startTime);
  const shiftEnd = new Date(shift.endTime);
  let totalBreakMinutes = 0;

  for (const b of breaks) {
    const bStart = new Date(b.start);
    const bEnd = new Date(b.end);

    // Clamp break to shift boundaries
    const clampedStart = bStart < shiftStart ? shiftStart : bStart;
    const clampedEnd = bEnd > shiftEnd ? shiftEnd : bEnd;

    if (clampedEnd > clampedStart) {
      totalBreakMinutes +=
        (clampedEnd.getTime() - clampedStart.getTime()) / 60_000;
    }
  }

  if (totalBreakMinutes < requiredBreakMinutes) {
    return {
      type: "INSUFFICIENT_BREAK",
      severity: "ERROR",
      message: `Insufficient break: ${totalBreakMinutes.toFixed(0)} min recorded, ${requiredBreakMinutes} min required`,
      requiredBreakMinutes,
      actualBreakMinutes: totalBreakMinutes,
    };
  }

  return null;
}

/**
 * Estimates the break impact across a set of shifts.
 *
 * Because break tracking is not yet in the schema, all required breaks are
 * counted as "not recorded". This gives a useful compliance percentage for
 * dashboard display without needing break data.
 */
export function estimateBreakImpact(
  shifts: Array<{ id: string; startTime: Date; endTime: Date }>,
  countryCode: string
): BreakSummary {
  let shiftsRequiringBreak = 0;
  let shiftsWithBreakRecorded = 0;

  for (const shift of shifts) {
    const durationHours =
      (new Date(shift.endTime).getTime() -
        new Date(shift.startTime).getTime()) /
      (1000 * 60 * 60);

    if (requiresBreak(durationHours, countryCode)) {
      shiftsRequiringBreak++;
      // No break data in schema — treat as not recorded
    }
  }

  const compliancePercent =
    shiftsRequiringBreak === 0
      ? 100
      : Math.round((shiftsWithBreakRecorded / shiftsRequiringBreak) * 100);

  return {
    shiftsRequiringBreak,
    shiftsWithBreakRecorded,
    compliancePercent,
  };
}
