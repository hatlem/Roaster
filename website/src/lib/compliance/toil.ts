// ─── TOIL (Time Off In Lieu) ─────────────────────────────────────────────────
// Norway: avspasering (AML 10-6(5)), Sweden: kompensationsledighet,
// France: RTT (Repos compensateur de remplacement)
//
// When an employee works overtime, they can choose to take equivalent
// time off instead of receiving overtime premium pay.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TOILConfig {
  enabled: boolean;
  expiryMonths: number; // How long before unused TOIL expires (default: 12)
  maxAccumulation: number; // Max TOIL hours that can be banked
  conversionRate: number; // 1.0 = hour for hour, 1.5 = 1.5 TOIL hours per OT hour
}

export interface TOILSummary {
  earned: number;
  used: number;
  expired: number;
  balance: number;
  maxAccumulation: number;
  nearExpiry: boolean;
  expiryDate: Date | null;
}

// ─── Per-country TOIL defaults ───────────────────────────────────────────────

export const TOIL_DEFAULTS: Record<string, TOILConfig> = {
  NO: { enabled: true, expiryMonths: 12, maxAccumulation: 200, conversionRate: 1.0 },
  SE: { enabled: true, expiryMonths: 12, maxAccumulation: 200, conversionRate: 1.0 },
  DK: { enabled: true, expiryMonths: 6, maxAccumulation: 150, conversionRate: 1.0 },
  FI: { enabled: true, expiryMonths: 12, maxAccumulation: 250, conversionRate: 1.0 },
  DE: { enabled: true, expiryMonths: 12, maxAccumulation: 200, conversionRate: 1.0 },
  FR: { enabled: true, expiryMonths: 12, maxAccumulation: 220, conversionRate: 1.25 }, // RTT
  AT: { enabled: true, expiryMonths: 12, maxAccumulation: 200, conversionRate: 1.0 },
  CH: { enabled: true, expiryMonths: 12, maxAccumulation: 200, conversionRate: 1.0 },
  DEFAULT: { enabled: false, expiryMonths: 12, maxAccumulation: 200, conversionRate: 1.0 },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the TOIL configuration for a given country code.
 * Falls back to DEFAULT if the country is not explicitly listed.
 */
export function getTOILConfig(countryCode: string): TOILConfig {
  return TOIL_DEFAULTS[countryCode.toUpperCase()] ?? TOIL_DEFAULTS["DEFAULT"];
}

/**
 * Calculates TOIL hours earned from overtime.
 * Applies the country-specific conversion rate and caps at maxAccumulation.
 */
export function calculateTOILEarned(
  overtimeHours: number,
  config: TOILConfig
): number {
  if (!config.enabled || overtimeHours <= 0) return 0;
  const earned = overtimeHours * config.conversionRate;
  return Math.min(earned, config.maxAccumulation);
}

/**
 * Calculates the current TOIL balance.
 */
export function calculateTOILBalance(
  earned: number,
  used: number,
  expired: number
): number {
  return Math.max(0, earned - used - expired);
}

/**
 * Checks whether a TOIL expiry date is approaching within the warning window.
 * Default warning period is 30 days.
 */
export function isNearExpiry(expiryDate: Date, warningDays = 30): boolean {
  const now = new Date();
  const warningThreshold = new Date(now);
  warningThreshold.setDate(warningThreshold.getDate() + warningDays);
  return expiryDate <= warningThreshold && expiryDate > now;
}

/**
 * Calculates the TOIL expiry date based on when hours were earned
 * and the configured expiry window.
 */
export function calculateExpiryDate(
  earnedDate: Date,
  config: TOILConfig
): Date {
  const expiry = new Date(earnedDate);
  expiry.setMonth(expiry.getMonth() + config.expiryMonths);
  return expiry;
}

/**
 * Builds a TOIL summary from raw data.
 */
export function buildTOILSummary(
  earned: number,
  used: number,
  expired: number,
  config: TOILConfig,
  earliestUnusedEarnedDate?: Date | null
): TOILSummary {
  const balance = calculateTOILBalance(earned, used, expired);

  let expiryDate: Date | null = null;
  let nearExpiry = false;

  if (earliestUnusedEarnedDate) {
    expiryDate = calculateExpiryDate(earliestUnusedEarnedDate, config);
    nearExpiry = isNearExpiry(expiryDate);
  }

  return {
    earned,
    used,
    expired,
    balance,
    maxAccumulation: config.maxAccumulation,
    nearExpiry,
    expiryDate,
  };
}
