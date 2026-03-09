/**
 * Annual Leave Enforcement — EU & Nordic Country Rules
 *
 * EU minimum: 4 weeks (20 working days). Nordic countries: 5 weeks (25 days).
 * Handles statutory minimums, seniority bonuses, carry-over caps, and utilization tracking.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnnualLeaveRules {
  /** EU/country statutory minimum days */
  statutoryMinDays: number;
  /** What most employees actually get (common practice / CBA standard) */
  commonEntitlement: number;
  /** How leave is accrued */
  accrualMethod: "calendar_year" | "anniversary" | "service_based";
  /** Whether unused days can carry over */
  carryOverAllowed: boolean;
  /** Maximum days that can carry over to next period */
  carryOverMaxDays: number;
  /** Deadline for using carry-over days (MM-DD format) */
  carryOverDeadline: string;
  /** Whether unused leave can be paid out instead */
  paidOut: boolean;
  /** Whether additional days are granted for long service / age */
  seniorityBonus: boolean;
  /** Rules for seniority-based extra days */
  seniorityBonusRules?: { years: number; extraDays: number }[];
  /** Reference to the relevant national legislation */
  legalReference: string;
}

export interface CarryOverStatus {
  /** Whether the carry-over deadline has passed */
  isExpired: boolean;
  /** Number of carry-over days that will/did expire */
  daysExpiring: number;
  /** The expiry date for carry-over days */
  expiryDate: Date;
  /** Number of days within the allowed carry-over limit */
  daysWithinLimit: number;
}

export interface LeaveUtilization {
  /** Percentage of entitlement used */
  percent: number;
  /** Classification of usage level */
  status: "low" | "normal" | "high" | "exceeded";
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const ANNUAL_LEAVE_RULES: Record<string, AnnualLeaveRules> = {
  NO: {
    statutoryMinDays: 25,
    commonEntitlement: 25,
    accrualMethod: "calendar_year",
    carryOverAllowed: true,
    carryOverMaxDays: 14,
    carryOverDeadline: "09-30",
    paidOut: false,
    seniorityBonus: true,
    seniorityBonusRules: [{ years: 60, extraDays: 1 }], // Age-based: extra week from age 60
    legalReference: "Ferieloven §5",
  },
  SE: {
    statutoryMinDays: 25,
    commonEntitlement: 25,
    accrualMethod: "calendar_year",
    carryOverAllowed: true,
    carryOverMaxDays: 5,
    carryOverDeadline: "03-31",
    paidOut: true,
    seniorityBonus: false,
    legalReference: "Semesterlagen §4",
  },
  DK: {
    statutoryMinDays: 25,
    commonEntitlement: 25,
    accrualMethod: "calendar_year", // New Danish system from 2020
    carryOverAllowed: true,
    carryOverMaxDays: 5,
    carryOverDeadline: "12-31",
    paidOut: true,
    seniorityBonus: false,
    legalReference: "Ferieloven §6",
  },
  FI: {
    statutoryMinDays: 24,
    commonEntitlement: 30,
    accrualMethod: "service_based",
    carryOverAllowed: false,
    carryOverMaxDays: 0,
    carryOverDeadline: "03-31",
    paidOut: true,
    seniorityBonus: true,
    seniorityBonusRules: [{ years: 1, extraDays: 6 }], // 30 days after 1 year of service
    legalReference: "Vuosilomalaki §5",
  },
  DE: {
    statutoryMinDays: 20,
    commonEntitlement: 30,
    accrualMethod: "calendar_year",
    carryOverAllowed: true,
    carryOverMaxDays: 20,
    carryOverDeadline: "03-31",
    paidOut: false,
    seniorityBonus: false,
    legalReference: "BUrlG §3",
  },
  AT: {
    statutoryMinDays: 25,
    commonEntitlement: 25,
    accrualMethod: "anniversary",
    carryOverAllowed: true,
    carryOverMaxDays: 25,
    carryOverDeadline: "03-31",
    paidOut: false,
    seniorityBonus: true,
    seniorityBonusRules: [{ years: 25, extraDays: 5 }], // 30 days after 25 years
    legalReference: "UrlG §2",
  },
  FR: {
    statutoryMinDays: 25,
    commonEntitlement: 25,
    accrualMethod: "calendar_year", // Actually June–May period
    carryOverAllowed: false,
    carryOverMaxDays: 0,
    carryOverDeadline: "05-31",
    paidOut: false,
    seniorityBonus: false,
    legalReference: "Code du Travail L3141-3",
  },
  NL: {
    statutoryMinDays: 20,
    commonEntitlement: 25,
    accrualMethod: "calendar_year",
    carryOverAllowed: true,
    carryOverMaxDays: 20,
    carryOverDeadline: "07-01",
    paidOut: true,
    seniorityBonus: false,
    legalReference: "BW 7:634",
  },
  GB: {
    statutoryMinDays: 28,
    commonEntitlement: 28, // Includes bank holidays
    accrualMethod: "anniversary",
    carryOverAllowed: false,
    carryOverMaxDays: 0,
    carryOverDeadline: "12-31",
    paidOut: true,
    seniorityBonus: false,
    legalReference: "WTR 1998 Reg 13",
  },
  IE: {
    statutoryMinDays: 20,
    commonEntitlement: 20,
    accrualMethod: "calendar_year",
    carryOverAllowed: false,
    carryOverMaxDays: 0,
    carryOverDeadline: "03-31",
    paidOut: true,
    seniorityBonus: false,
    legalReference: "OWTA 1997 S19",
  },
  ES: {
    statutoryMinDays: 22,
    commonEntitlement: 22,
    accrualMethod: "calendar_year",
    carryOverAllowed: false,
    carryOverMaxDays: 0,
    carryOverDeadline: "01-31",
    paidOut: false,
    seniorityBonus: false,
    legalReference: "ET Art 38",
  },
  IT: {
    statutoryMinDays: 20,
    commonEntitlement: 20,
    accrualMethod: "calendar_year",
    carryOverAllowed: true,
    carryOverMaxDays: 10,
    carryOverDeadline: "06-30",
    paidOut: false,
    seniorityBonus: false,
    legalReference: "D.Lgs 66/2003 Art 10",
  },
  PT: {
    statutoryMinDays: 22,
    commonEntitlement: 22,
    accrualMethod: "calendar_year",
    carryOverAllowed: false,
    carryOverMaxDays: 0,
    carryOverDeadline: "12-31",
    paidOut: false,
    seniorityBonus: true,
    seniorityBonusRules: [{ years: 1, extraDays: 1 }],
    legalReference: "CT Art 238",
  },
  PL: {
    statutoryMinDays: 20,
    commonEntitlement: 26,
    accrualMethod: "calendar_year",
    carryOverAllowed: true,
    carryOverMaxDays: 26,
    carryOverDeadline: "09-30",
    paidOut: true,
    seniorityBonus: true,
    seniorityBonusRules: [{ years: 10, extraDays: 6 }], // 26 days after 10 years
    legalReference: "KP Art 154",
  },
  CH: {
    statutoryMinDays: 20,
    commonEntitlement: 25,
    accrualMethod: "calendar_year",
    carryOverAllowed: true,
    carryOverMaxDays: 5,
    carryOverDeadline: "03-31",
    paidOut: true,
    seniorityBonus: true,
    seniorityBonusRules: [{ years: 20, extraDays: 5 }],
    legalReference: "OR Art 329a",
  },
  BE: {
    statutoryMinDays: 20,
    commonEntitlement: 20,
    accrualMethod: "calendar_year",
    carryOverAllowed: false,
    carryOverMaxDays: 0,
    carryOverDeadline: "12-31",
    paidOut: true,
    seniorityBonus: false,
    legalReference: "Loi 28/6/1971",
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the annual leave rules for the given country code.
 * Falls back to a conservative EU default (20 days) if country is unknown.
 */
export function getAnnualLeaveRules(countryCode: string): AnnualLeaveRules {
  const rules = ANNUAL_LEAVE_RULES[countryCode.toUpperCase()];
  if (rules) return rules;

  // EU default fallback
  return {
    statutoryMinDays: 20,
    commonEntitlement: 20,
    accrualMethod: "calendar_year",
    carryOverAllowed: true,
    carryOverMaxDays: 5,
    carryOverDeadline: "03-31",
    paidOut: false,
    seniorityBonus: false,
    legalReference: "EU WTD Art 7",
  };
}

/**
 * Calculates the statutory leave entitlement, considering:
 * - Country-specific statutory minimum
 * - Seniority bonuses (years of service)
 * - Age-based extras (e.g. Norway: +1 week from age 60)
 *
 * @param countryCode ISO country code
 * @param hireDate    Employee's hire date (for service-based seniority)
 * @param dateOfBirth Employee's date of birth (for age-based bonuses like NO)
 * @returns Total entitlement in working days
 */
export function calculateEntitlement(
  countryCode: string,
  hireDate: Date | null,
  dateOfBirth: Date | null
): number {
  const rules = getAnnualLeaveRules(countryCode);
  let entitlement = rules.commonEntitlement;

  if (!rules.seniorityBonus || !rules.seniorityBonusRules?.length) {
    return entitlement;
  }

  const now = new Date();

  // Norway uses age-based bonus (extra week from age 60)
  // The threshold is typically high (>= 50 years) — treat as age-based
  const isAgeBased = rules.seniorityBonusRules.some((r) => r.years >= 50);

  if (isAgeBased && dateOfBirth) {
    const age = differenceInYears(dateOfBirth, now);
    for (const rule of rules.seniorityBonusRules) {
      if (age >= rule.years) {
        entitlement += rule.extraDays;
      }
    }
  } else if (!isAgeBased && hireDate) {
    // Service-based seniority (Finland, Austria, Poland, etc.)
    const yearsOfService = differenceInYears(hireDate, now);
    for (const rule of rules.seniorityBonusRules) {
      if (yearsOfService >= rule.years) {
        entitlement += rule.extraDays;
      }
    }
  }

  return entitlement;
}

/**
 * Checks whether carry-over days comply with country rules.
 *
 * @param carryOverDays  Number of carry-over days the employee has
 * @param carryOverDate  The actual expiry date (from AccrualBalance.carryOverExpiry)
 * @param countryCode    ISO country code
 * @returns Status object with expiry info and limit compliance
 */
export function checkCarryOverCompliance(
  carryOverDays: number,
  carryOverDate: string | Date | null,
  countryCode: string
): CarryOverStatus {
  const rules = getAnnualLeaveRules(countryCode);
  const now = new Date();

  // Build the expiry date from the carry-over deadline
  let expiryDate: Date;
  if (carryOverDate) {
    expiryDate = new Date(carryOverDate);
  } else {
    // Construct from deadline pattern "MM-DD" in the current year
    const [month, day] = rules.carryOverDeadline.split("-").map(Number);
    expiryDate = new Date(now.getFullYear(), month - 1, day);
    // If the deadline already passed this year, it applies to next year
    if (expiryDate < now) {
      expiryDate = new Date(now.getFullYear() + 1, month - 1, day);
    }
  }

  const isExpired = now > expiryDate;
  const daysWithinLimit = Math.min(carryOverDays, rules.carryOverMaxDays);
  const daysExpiring = rules.carryOverAllowed
    ? Math.max(0, carryOverDays - rules.carryOverMaxDays)
    : carryOverDays; // If carry-over not allowed, all days expire

  return {
    isExpired,
    daysExpiring,
    expiryDate,
    daysWithinLimit,
  };
}

/**
 * Returns true if the employee's entitlement is below the statutory minimum.
 */
export function isEntitlementBelowStatutory(
  entitlement: number,
  countryCode: string
): boolean {
  const rules = getAnnualLeaveRules(countryCode);
  return entitlement < rules.statutoryMinDays;
}

/**
 * Calculates leave utilization and classifies the status.
 *
 * - low:      < 25% used (employee may lose days if carry-over is limited)
 * - normal:   25–90% used
 * - high:     90–100% used
 * - exceeded: > 100% used (more than entitled)
 */
export function getLeaveUtilization(
  used: number,
  total: number
): LeaveUtilization {
  if (total <= 0) {
    return { percent: 0, status: used > 0 ? "exceeded" : "low" };
  }

  const percent = Math.round((used / total) * 100);

  let status: LeaveUtilization["status"];
  if (percent > 100) {
    status = "exceeded";
  } else if (percent >= 90) {
    status = "high";
  } else if (percent >= 25) {
    status = "normal";
  } else {
    status = "low";
  }

  return { percent, status };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Calculate the difference in whole years between two dates.
 */
function differenceInYears(earlier: Date, later: Date): number {
  const e = new Date(earlier);
  const l = new Date(later);
  let years = l.getFullYear() - e.getFullYear();
  const monthDiff = l.getMonth() - e.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && l.getDate() < e.getDate())) {
    years--;
  }
  return Math.max(0, years);
}
