// ─── Flex-Time Banking (Arbeitszeitkonto / Flextid) ──────────────────────────
// Germany: Arbeitszeitkonto (ArbZG), Sweden: Flextid,
// Austria: Gleitzeitkonto, Switzerland: Jahresarbeitszeitkonto
//
// Workers can work more/fewer hours than contracted in a given period.
// The balance is tracked in a time account and should return to zero
// over the settlement period (monthly/quarterly/yearly).

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FlexTimeConfig {
  enabled: boolean;
  maxPositiveHours: number; // Max hours that can be banked (surplus)
  maxNegativeHours: number; // Max hours that can be owed (deficit)
  settlementPeriod: "monthly" | "quarterly" | "yearly";
  autoSettle: boolean; // Auto-reset balance at period end?
}

export interface FlexTimeStatus {
  balance: number; // Current balance (+/-)
  maxPositive: number;
  maxNegative: number;
  withinLimits: boolean;
  warning: string | null;
  settlementPeriodEnd: Date;
  settlementPeriod: string;
}

// ─── Per-country flex-time defaults ──────────────────────────────────────────

export const FLEX_TIME_DEFAULTS: Record<string, FlexTimeConfig> = {
  DE: { enabled: true, maxPositiveHours: 40, maxNegativeHours: 20, settlementPeriod: "quarterly", autoSettle: false },
  AT: { enabled: true, maxPositiveHours: 40, maxNegativeHours: 20, settlementPeriod: "quarterly", autoSettle: false },
  CH: { enabled: true, maxPositiveHours: 60, maxNegativeHours: 20, settlementPeriod: "yearly", autoSettle: false },
  SE: { enabled: true, maxPositiveHours: 40, maxNegativeHours: 20, settlementPeriod: "monthly", autoSettle: false },
  NO: { enabled: true, maxPositiveHours: 40, maxNegativeHours: 20, settlementPeriod: "quarterly", autoSettle: false },
  DK: { enabled: true, maxPositiveHours: 40, maxNegativeHours: 20, settlementPeriod: "quarterly", autoSettle: false },
  FI: { enabled: true, maxPositiveHours: 40, maxNegativeHours: 20, settlementPeriod: "quarterly", autoSettle: false },
  FR: { enabled: true, maxPositiveHours: 35, maxNegativeHours: 15, settlementPeriod: "yearly", autoSettle: false },
  DEFAULT: { enabled: false, maxPositiveHours: 40, maxNegativeHours: 20, settlementPeriod: "quarterly", autoSettle: false },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the flex-time configuration for a given country code.
 * Falls back to DEFAULT if the country is not explicitly listed.
 */
export function getFlexTimeConfig(countryCode: string): FlexTimeConfig {
  return FLEX_TIME_DEFAULTS[countryCode.toUpperCase()] ?? FLEX_TIME_DEFAULTS["DEFAULT"];
}

/**
 * Calculates the delta between scheduled and actual hours.
 * Positive = worker worked more than scheduled (credit).
 * Negative = worker worked less than scheduled (deficit).
 */
export function calculateDelta(
  scheduledHours: number,
  actualHours: number
): number {
  return actualHours - scheduledHours;
}

/**
 * Checks whether the current balance is within the configured limits.
 * Returns an object with the result and an optional warning message.
 */
export function isBalanceWithinLimits(
  balance: number,
  config: FlexTimeConfig
): { ok: boolean; warning?: string } {
  if (balance > config.maxPositiveHours) {
    return {
      ok: false,
      warning: `Flex-time balance (${balance.toFixed(1)}h) exceeds maximum surplus of ${config.maxPositiveHours}h`,
    };
  }

  if (balance < -config.maxNegativeHours) {
    return {
      ok: false,
      warning: `Flex-time balance (${balance.toFixed(1)}h) exceeds maximum deficit of -${config.maxNegativeHours}h`,
    };
  }

  // Warn at 80% of limits
  const positiveThreshold = config.maxPositiveHours * 0.8;
  const negativeThreshold = config.maxNegativeHours * 0.8;

  if (balance > positiveThreshold) {
    return {
      ok: true,
      warning: `Flex-time balance (${balance.toFixed(1)}h) is approaching surplus limit of ${config.maxPositiveHours}h`,
    };
  }

  if (balance < -negativeThreshold) {
    return {
      ok: true,
      warning: `Flex-time balance (${balance.toFixed(1)}h) is approaching deficit limit of -${config.maxNegativeHours}h`,
    };
  }

  return { ok: true };
}

/**
 * Calculates the end date of the settlement period containing the given date.
 */
export function getSettlementPeriodEnd(
  date: Date,
  period: FlexTimeConfig["settlementPeriod"]
): Date {
  const d = new Date(date);

  switch (period) {
    case "monthly": {
      // Last day of current month
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      return end;
    }
    case "quarterly": {
      // End of current quarter
      const quarterMonth = Math.floor(d.getMonth() / 3) * 3 + 3;
      const end = new Date(d.getFullYear(), quarterMonth, 0, 23, 59, 59);
      return end;
    }
    case "yearly": {
      // End of current year (Dec 31)
      const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59);
      return end;
    }
    default:
      return getSettlementPeriodEnd(date, "quarterly");
  }
}

/**
 * Calculates the start date of the settlement period containing the given date.
 */
export function getSettlementPeriodStart(
  date: Date,
  period: FlexTimeConfig["settlementPeriod"]
): Date {
  const d = new Date(date);

  switch (period) {
    case "monthly":
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case "quarterly": {
      const quarterMonth = Math.floor(d.getMonth() / 3) * 3;
      return new Date(d.getFullYear(), quarterMonth, 1);
    }
    case "yearly":
      return new Date(d.getFullYear(), 0, 1);
    default:
      return getSettlementPeriodStart(date, "quarterly");
  }
}

/**
 * Builds a FlexTimeStatus object from balance and config.
 */
export function buildFlexTimeStatus(
  balance: number,
  config: FlexTimeConfig,
  referenceDate?: Date
): FlexTimeStatus {
  const date = referenceDate ?? new Date();
  const limits = isBalanceWithinLimits(balance, config);
  const settlementPeriodEnd = getSettlementPeriodEnd(date, config.settlementPeriod);

  return {
    balance,
    maxPositive: config.maxPositiveHours,
    maxNegative: config.maxNegativeHours,
    withinLimits: limits.ok,
    warning: limits.warning ?? null,
    settlementPeriodEnd,
    settlementPeriod: config.settlementPeriod,
  };
}
