/**
 * Contracted Hours Validation — EU Directive 2019/1152
 *
 * Employers must specify minimum guaranteed working hours.
 * Zero-hours contracts are restricted in many EU countries.
 * Ireland has a unique "banded hours" right after 6 months.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContractedHoursRules {
  /** Whether zero-hours contracts are legally permitted */
  zeroHoursAllowed: boolean;
  /** Minimum hours an employer must guarantee (0 = no minimum) */
  minGuaranteedHours: number;
  /** Maximum hours that can be scheduled per week */
  maxWeeklySchedule: number;
  /** Ireland-specific: right to banded hours after 6 months */
  bandedHoursRight: boolean;
  /** Reference to the relevant national legislation */
  legalReference: string;
}

export interface ContractViolation {
  /** Type of violation detected */
  type:
    | "ZERO_HOURS_NOT_ALLOWED"
    | "BELOW_MIN_GUARANTEED"
    | "EXCEEDS_MAX_WEEKLY"
    | "BANDED_HOURS_ELIGIBLE";
  /** Severity level */
  severity: "ERROR" | "WARNING";
  /** Human-readable violation description */
  message: string;
  /** Legal reference for the violation */
  legalReference: string;
}

export interface ScheduleContractStatus {
  /** Whether employee is scheduled below contracted hours */
  underScheduled: boolean;
  /** Whether employee is scheduled above contracted hours */
  overScheduled: boolean;
  /** Absolute difference between scheduled and contracted hours */
  variance: number;
  /** Percentage variance from contracted hours */
  variancePercent: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const CONTRACTED_HOURS_RULES: Record<string, ContractedHoursRules> = {
  NO: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 40,
    bandedHoursRight: false,
    legalReference: "AML §14-9",
  },
  SE: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 40,
    bandedHoursRight: false,
    legalReference: "LAS",
  },
  DK: {
    zeroHoursAllowed: true,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "Ansaettelsesbevisloven",
  },
  FI: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 40,
    bandedHoursRight: false,
    legalReference: "Tyosopimuslaki",
  },
  DE: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "TzBfG",
  },
  AT: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "AZG §3",
  },
  FR: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 24,
    maxWeeklySchedule: 35,
    bandedHoursRight: false,
    legalReference: "Code du Travail L3123-7",
  },
  NL: {
    zeroHoursAllowed: true,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "BW 7:628a",
  },
  GB: {
    zeroHoursAllowed: true,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "Employment Rights Act 1996",
  },
  IE: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: true,
    legalReference: "Employment (Misc) Act 2018",
  },
  ES: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 10,
    maxWeeklySchedule: 40,
    bandedHoursRight: false,
    legalReference: "ET Art 12.5",
  },
  IT: {
    zeroHoursAllowed: true,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "D.Lgs 81/2015",
  },
  PT: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "CT Art 150",
  },
  PL: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "KP Art 129",
  },
  CH: {
    zeroHoursAllowed: true,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 50,
    bandedHoursRight: false,
    legalReference: "ArG Art 9",
  },
  BE: {
    zeroHoursAllowed: false,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "Loi 16 mars 1971",
  },
  DEFAULT: {
    zeroHoursAllowed: true,
    minGuaranteedHours: 0,
    maxWeeklySchedule: 48,
    bandedHoursRight: false,
    legalReference: "EU 2019/1152",
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the contracted hours rules for the given country code.
 * Falls back to DEFAULT if the country code is not recognised.
 */
export function getContractedHoursRules(
  countryCode: string
): ContractedHoursRules {
  return (
    CONTRACTED_HOURS_RULES[countryCode.toUpperCase()] ??
    CONTRACTED_HOURS_RULES["DEFAULT"]!
  );
}

/**
 * Validates an employee's contracted hours against country-specific rules.
 *
 * Checks:
 * 1. Zero-hours contracts — is the employee on a zero-hours/ZERO_HOURS contract
 *    in a country that doesn't allow it?
 * 2. Minimum guaranteed hours — does the contract meet the country minimum?
 * 3. Banded hours — Ireland-specific right to request banded hours after 6 months.
 *
 * @param contractedHours  Weekly contracted hours (null = not set)
 * @param employmentType   From EmploymentType enum: PERMANENT, TEMPORARY, ZERO_HOURS, etc.
 * @param countryCode      ISO country code
 * @returns Array of violations (empty if compliant)
 */
export function validateContractedHours(
  contractedHours: number | null,
  employmentType: string,
  countryCode: string
): ContractViolation[] {
  const rules = getContractedHoursRules(countryCode);
  const violations: ContractViolation[] = [];

  // Check 1: Zero-hours contracts
  const isZeroHours =
    employmentType === "ZERO_HOURS" ||
    contractedHours === 0 ||
    contractedHours === null;

  if (isZeroHours && !rules.zeroHoursAllowed) {
    violations.push({
      type: "ZERO_HOURS_NOT_ALLOWED",
      severity: "ERROR",
      message: `Zero-hours contracts are not permitted in ${countryCode}. A minimum guaranteed number of hours must be specified.`,
      legalReference: rules.legalReference,
    });
  }

  // Check 2: Below minimum guaranteed hours
  if (
    contractedHours !== null &&
    contractedHours > 0 &&
    rules.minGuaranteedHours > 0 &&
    contractedHours < rules.minGuaranteedHours
  ) {
    violations.push({
      type: "BELOW_MIN_GUARANTEED",
      severity: "ERROR",
      message: `Contracted hours (${contractedHours}h/week) are below the minimum guaranteed hours (${rules.minGuaranteedHours}h/week) required in ${countryCode}.`,
      legalReference: rules.legalReference,
    });
  }

  // Check 3: Exceeds max weekly schedule
  if (contractedHours !== null && contractedHours > rules.maxWeeklySchedule) {
    violations.push({
      type: "EXCEEDS_MAX_WEEKLY",
      severity: "ERROR",
      message: `Contracted hours (${contractedHours}h/week) exceed the maximum weekly schedule (${rules.maxWeeklySchedule}h/week) in ${countryCode}.`,
      legalReference: rules.legalReference,
    });
  }

  // Check 4: Banded hours eligibility (Ireland)
  if (rules.bandedHoursRight && employmentType === "ZERO_HOURS") {
    violations.push({
      type: "BANDED_HOURS_ELIGIBLE",
      severity: "WARNING",
      message: `Employee on zero-hours contract in ${countryCode} may be eligible for banded hours rights after 6 months of service.`,
      legalReference: rules.legalReference,
    });
  }

  return violations;
}

/**
 * Compares scheduled hours for a period against contracted hours.
 *
 * @param scheduledHours   Total hours scheduled for the period (e.g. this week)
 * @param contractedHours  Weekly contracted hours (null = not set)
 * @returns Status object indicating under/over scheduling
 */
export function checkScheduleVsContract(
  scheduledHours: number,
  contractedHours: number | null
): ScheduleContractStatus {
  // If no contracted hours, we can't compare
  if (contractedHours === null || contractedHours === 0) {
    return {
      underScheduled: false,
      overScheduled: false,
      variance: 0,
      variancePercent: 0,
    };
  }

  const variance = Math.abs(scheduledHours - contractedHours);
  const variancePercent =
    contractedHours > 0 ? Math.round((variance / contractedHours) * 100) : 0;

  return {
    underScheduled: scheduledHours < contractedHours,
    overScheduled: scheduledHours > contractedHours,
    variance,
    variancePercent,
  };
}

/**
 * Returns true if the employee's contract represents a zero-hours violation
 * in the given country.
 */
export function isZeroHoursViolation(
  employmentType: string,
  contractedHours: number | null,
  countryCode: string
): boolean {
  const rules = getContractedHoursRules(countryCode);
  if (rules.zeroHoursAllowed) return false;

  return (
    employmentType === "ZERO_HOURS" ||
    contractedHours === 0 ||
    contractedHours === null
  );
}
