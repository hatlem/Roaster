"use client";

import { useState, useEffect, useCallback } from "react";

interface FlexTimeData {
  balance: number;
  maxPositive: number;
  maxNegative: number;
  withinLimits: boolean;
  warning: string | null;
  settlementPeriodEnd: string;
  settlementPeriod: string;
  config: {
    enabled: boolean;
    maxPositiveHours: number;
    maxNegativeHours: number;
    settlementPeriod: string;
    autoSettle: boolean;
  };
  entries: Array<{
    date: string;
    actualHours?: number;
    delta: number;
  }>;
}

interface FlexTimeCardProps {
  userId: string;
  dictionary: Record<string, unknown>;
}

export function FlexTimeCard({ userId, dictionary }: FlexTimeCardProps) {
  const [data, setData] = useState<FlexTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve dictionary labels with fallbacks
  const dict = dictionary as Record<string, Record<string, string>>;
  const t = {
    title: dict?.flexTime?.title ?? "Flex-Time Balance",
    balance: dict?.flexTime?.balance ?? "Balance",
    surplus: dict?.flexTime?.surplus ?? "Surplus",
    deficit: dict?.flexTime?.deficit ?? "Deficit",
    limit: dict?.flexTime?.limit ?? "Limit",
    settlementEnd: dict?.flexTime?.settlementEnd ?? "Settlement period ends",
    monthly: dict?.flexTime?.monthly ?? "Monthly",
    quarterly: dict?.flexTime?.quarterly ?? "Quarterly",
    yearly: dict?.flexTime?.yearly ?? "Yearly",
    withinLimits: dict?.flexTime?.withinLimits ?? "Within limits",
    approachingLimit: dict?.flexTime?.approachingLimit ?? "Approaching limit",
    exceededLimit: dict?.flexTime?.exceededLimit ?? "Limit exceeded",
    notEnabled: dict?.flexTime?.notEnabled ?? "Flex-time is not enabled for your region",
    hoursUnit: dict?.common?.hoursUnit ?? "h",
    loading: dict?.common?.loading ?? "Loading...",
    error: dict?.common?.error ?? "Failed to load data",
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userId) params.set("employeeId", userId);

      const res = await fetch(`/api/compliance/flex-time?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? t.error);
        return;
      }

      setData(json.data);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [userId, t.error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone/50 p-6 animate-pulse">
        <div className="h-5 w-36 bg-stone/30 rounded mb-4" />
        <div className="h-4 w-48 bg-stone/20 rounded mb-3" />
        <div className="h-3 w-full bg-stone/10 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-stone/50 p-6">
        <h3 className="text-sm font-semibold text-ink/80 mb-2">{t.title}</h3>
        <p className="text-sm text-terracotta">{error}</p>
      </div>
    );
  }

  if (!data || !data.config.enabled) {
    return (
      <div className="bg-white rounded-2xl border border-stone/50 p-6">
        <h3 className="text-sm font-semibold text-ink/80 mb-2">{t.title}</h3>
        <p className="text-sm text-ink/50">{t.notEnabled}</p>
      </div>
    );
  }

  // Gauge positioning: center = 0, left = -maxNegative, right = +maxPositive
  const totalRange = data.maxNegative + data.maxPositive;
  const zeroPosition = (data.maxNegative / totalRange) * 100;
  const clampedBalance = Math.max(
    -data.maxNegative,
    Math.min(data.maxPositive, data.balance)
  );
  const balancePosition = ((clampedBalance + data.maxNegative) / totalRange) * 100;

  // Color: forest for balanced, amber for approaching limit, terracotta for exceeded
  const getStatusColor = () => {
    if (!data.withinLimits) return { text: "text-terracotta", bg: "bg-terracotta", label: t.exceededLimit };
    if (data.warning) return { text: "text-amber-600", bg: "bg-amber-500", label: t.approachingLimit };
    return { text: "text-forest", bg: "bg-forest", label: t.withinLimits };
  };

  const status = getStatusColor();

  const periodLabel =
    data.config.settlementPeriod === "monthly"
      ? t.monthly
      : data.config.settlementPeriod === "quarterly"
        ? t.quarterly
        : t.yearly;

  const balanceSign = data.balance >= 0 ? "+" : "";

  return (
    <div className="bg-white rounded-2xl border border-stone/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink/80">{t.title}</h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            !data.withinLimits
              ? "text-terracotta bg-red-50"
              : data.warning
                ? "text-amber-600 bg-amber-50"
                : "text-forest bg-emerald-50"
          }`}
        >
          {status.label}
        </span>
      </div>

      {/* Balance display */}
      <div className="text-center mb-5">
        <p className={`text-3xl font-bold ${status.text}`}>
          {balanceSign}{data.balance.toFixed(1)}{t.hoursUnit}
        </p>
        <p className="text-xs text-ink/40 mt-1">{t.balance}</p>
      </div>

      {/* Horizontal gauge */}
      <div className="mb-4">
        <div className="relative h-3 bg-stone/20 rounded-full overflow-hidden">
          {/* Zero line marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-ink/20 z-10"
            style={{ left: `${zeroPosition}%` }}
          />

          {/* Balance fill */}
          {data.balance >= 0 ? (
            <div
              className={`absolute top-0 bottom-0 rounded-r-full transition-all duration-500 ${status.bg}`}
              style={{
                left: `${zeroPosition}%`,
                width: `${balancePosition - zeroPosition}%`,
              }}
            />
          ) : (
            <div
              className={`absolute top-0 bottom-0 rounded-l-full transition-all duration-500 ${status.bg}`}
              style={{
                left: `${balancePosition}%`,
                width: `${zeroPosition - balancePosition}%`,
              }}
            />
          )}
        </div>

        {/* Gauge labels */}
        <div className="flex justify-between text-[10px] text-ink/40 mt-1">
          <span>-{data.maxNegative}{t.hoursUnit}</span>
          <span>0</span>
          <span>+{data.maxPositive}{t.hoursUnit}</span>
        </div>
      </div>

      {/* Limits info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center p-2 bg-stone/10 rounded-lg">
          <p className="text-xs text-ink/50">{t.surplus} {t.limit}</p>
          <p className="text-sm font-medium text-ink">
            +{data.maxPositive}{t.hoursUnit}
          </p>
        </div>
        <div className="text-center p-2 bg-stone/10 rounded-lg">
          <p className="text-xs text-ink/50">{t.deficit} {t.limit}</p>
          <p className="text-sm font-medium text-ink">
            -{data.maxNegative}{t.hoursUnit}
          </p>
        </div>
      </div>

      {/* Settlement period end */}
      <div className="flex items-center justify-between text-xs text-ink/50 pt-2 border-t border-stone/20">
        <span>{t.settlementEnd}</span>
        <span className="font-medium text-ink/70">
          {new Date(data.settlementPeriodEnd).toLocaleDateString()} ({periodLabel})
        </span>
      </div>

      {/* Warning message */}
      {data.warning && (
        <p className="text-xs text-amber-600 mt-3 p-2 bg-amber-50 rounded-lg">
          {data.warning}
        </p>
      )}
    </div>
  );
}
