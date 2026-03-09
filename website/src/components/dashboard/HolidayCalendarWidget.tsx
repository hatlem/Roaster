"use client";

import { useEffect, useState } from "react";

interface Holiday {
  name: string;
  nameLocal: string;
  date: string;
  isMoveable: boolean;
}

interface SundayRules {
  restricted: boolean;
  premiumRequired: boolean;
  defaultPremium: number;
  requiresJustification: boolean;
  exceptions: string[];
  legalReference: string;
}

interface HolidayData {
  countryCode: string;
  year: number;
  holidays: Holiday[];
  sundayRules: SundayRules;
  upcoming: Holiday[];
  source: "database" | "static";
}

interface HolidayCalendarWidgetProps {
  countryCode: string;
  dictionary: Record<string, string>;
}

export function HolidayCalendarWidget({
  countryCode,
  dictionary,
}: HolidayCalendarWidgetProps) {
  const [data, setData] = useState<HolidayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        const year = new Date().getFullYear();
        const res = await fetch(
          `/api/compliance/holidays?country=${countryCode}&year=${year}`
        );
        const json = await res.json();

        if (!json.success) {
          setError(json.error ?? "Failed to load holidays");
          return;
        }

        setData(json.data);
      } catch {
        setError("Failed to load holiday data");
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [countryCode]);

  const t = (key: string, fallback: string) =>
    dictionary[key] ?? fallback;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-36 bg-stone-100 rounded" />
          <div className="h-4 w-48 bg-stone-50 rounded" />
          <div className="space-y-2 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-stone-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <p className="text-sm text-stone-500">
          {error ?? t("holidayWidget.error", "Unable to load holidays")}
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const daysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return t("holidayWidget.today", "Today");
    if (diff === 1) return t("holidayWidget.tomorrow", "Tomorrow");
    return `${diff} ${t("holidayWidget.daysAway", "days")}`;
  };

  const sundayLabel = data.sundayRules.restricted
    ? t("holidayWidget.sundayRestricted", "Restricted")
    : t("holidayWidget.sundayUnrestricted", "Unrestricted");

  const premiumLabel = data.sundayRules.premiumRequired
    ? `${((data.sundayRules.defaultPremium - 1) * 100).toFixed(0)}% ${t("holidayWidget.premium", "premium")}`
    : t("holidayWidget.noPremium", "No premium");

  return (
    <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="fas fa-calendar-star text-terracotta text-lg" />
          <h3 className="font-semibold text-stone-800">
            {t("holidayWidget.title", "Public Holidays")}
          </h3>
        </div>
        <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">
          {data.countryCode}
        </span>
      </div>

      {/* Sunday rules badge */}
      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
        <i
          className={`fas fa-church text-sm ${
            data.sundayRules.restricted
              ? "text-amber-500"
              : "text-emerald-500"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-stone-700">
            {t("holidayWidget.sundayWork", "Sunday Work")}:{" "}
            <span
              className={
                data.sundayRules.restricted
                  ? "text-amber-600"
                  : "text-emerald-600"
              }
            >
              {sundayLabel}
            </span>
          </p>
          <p className="text-xs text-stone-400">
            {premiumLabel} &middot; {data.sundayRules.legalReference}
          </p>
        </div>
      </div>

      {/* Upcoming holidays list */}
      <div className="space-y-2">
        {data.upcoming.map((holiday, idx) => (
          <div
            key={`${holiday.date}-${idx}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors duration-150"
          >
            <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-terracotta">
                {new Date(holiday.date + "T00:00:00").getDate()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">
                {holiday.nameLocal}
              </p>
              <p className="text-xs text-stone-400">{formatDate(holiday.date)}</p>
            </div>
            <span className="text-xs text-stone-400 whitespace-nowrap">
              {daysUntil(holiday.date)}
            </span>
          </div>
        ))}

        {data.upcoming.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-4">
            {t("holidayWidget.noUpcoming", "No upcoming holidays")}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-stone-100">
        <p className="text-xs text-stone-400 text-center">
          {data.holidays.length}{" "}
          {t("holidayWidget.totalHolidays", "public holidays in")}{" "}
          {data.year}
        </p>
      </div>
    </div>
  );
}
