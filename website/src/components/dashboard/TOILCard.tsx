"use client";

import { useState, useEffect, useCallback } from "react";

interface TOILData {
  earned: number;
  used: number;
  expired: number;
  balance: number;
  maxAccumulation: number;
  nearExpiry: boolean;
  expiryDate: string | null;
  config: {
    enabled: boolean;
    expiryMonths: number;
    maxAccumulation: number;
    conversionRate: number;
  };
}

interface TOILCardProps {
  userId: string;
  dictionary: Record<string, unknown>;
}

export function TOILCard({ userId, dictionary }: TOILCardProps) {
  const [data, setData] = useState<TOILData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [requestHours, setRequestHours] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Resolve dictionary labels with fallbacks
  const dict = dictionary as Record<string, Record<string, string>>;
  const t = {
    title: dict?.toil?.title ?? "TOIL Balance",
    earned: dict?.toil?.earned ?? "Earned",
    used: dict?.toil?.used ?? "Used",
    remaining: dict?.toil?.remaining ?? "Remaining",
    expires: dict?.toil?.expires ?? "Expires",
    expiryWarning: dict?.toil?.expiryWarning ?? "TOIL hours expiring soon",
    requestButton: dict?.toil?.requestButton ?? "Request TOIL",
    requestTitle: dict?.toil?.requestTitle ?? "Request Time Off (TOIL)",
    hours: dict?.toil?.hours ?? "Hours",
    date: dict?.toil?.date ?? "Date",
    notes: dict?.toil?.notes ?? "Notes (optional)",
    submit: dict?.toil?.submit ?? "Submit Request",
    cancel: dict?.toil?.cancel ?? "Cancel",
    notEnabled: dict?.toil?.notEnabled ?? "TOIL is not enabled for your region",
    loading: dict?.common?.loading ?? "Loading...",
    error: dict?.common?.error ?? "Failed to load data",
    of: dict?.common?.of ?? "of",
    hoursUnit: dict?.common?.hoursUnit ?? "h",
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userId) params.set("employeeId", userId);

      const res = await fetch(`/api/compliance/toil?${params.toString()}`);
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

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/compliance/toil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: parseFloat(requestHours),
          date: requestDate,
          notes: requestNotes || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setSubmitError(json.error ?? "Failed to submit request");
        return;
      }

      // Reset form and refresh data
      setShowModal(false);
      setRequestHours("");
      setRequestDate("");
      setRequestNotes("");
      fetchData();
    } catch {
      setSubmitError("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone/50 p-6 animate-pulse">
        <div className="h-5 w-32 bg-stone/30 rounded mb-4" />
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

  const usagePercent = data.maxAccumulation > 0
    ? Math.min(100, (data.balance / data.maxAccumulation) * 100)
    : 0;

  // forest green < 80%, amber 80-95%, terracotta > 95%
  const barColor =
    usagePercent > 95
      ? "bg-terracotta"
      : usagePercent > 80
        ? "bg-amber-500"
        : "bg-forest";

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink/80">{t.title}</h3>
          {data.nearExpiry && data.expiryDate && (
            <span className="text-xs text-amber-600 font-medium px-2 py-0.5 bg-amber-50 rounded-full">
              {t.expiryWarning}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-ink/50 mb-0.5">{t.earned}</p>
            <p className="text-lg font-semibold text-ink">
              {data.earned.toFixed(1)}{t.hoursUnit}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink/50 mb-0.5">{t.used}</p>
            <p className="text-lg font-semibold text-ink">
              {data.used.toFixed(1)}{t.hoursUnit}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink/50 mb-0.5">{t.remaining}</p>
            <p className="text-lg font-semibold text-forest">
              {data.balance.toFixed(1)}{t.hoursUnit}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-ink/40 mb-1">
            <span>0{t.hoursUnit}</span>
            <span>
              {data.balance.toFixed(0)} {t.of} {data.maxAccumulation}{t.hoursUnit}
            </span>
          </div>
          <div className="h-2 bg-stone/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        {/* Expiry info */}
        {data.expiryDate && (
          <p className="text-xs text-ink/40 mb-3">
            {t.expires}: {new Date(data.expiryDate).toLocaleDateString()}
          </p>
        )}

        {/* Request button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full text-sm font-medium text-forest border border-forest/30 rounded-lg py-2 px-4 hover:bg-forest/5 transition-colors"
        >
          {t.requestButton}
        </button>
      </div>

      {/* Request modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-ink mb-4">
              {t.requestTitle}
            </h3>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm text-ink/70 mb-1">{t.hours}</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max={data.balance}
                  value={requestHours}
                  onChange={(e) => setRequestHours(e.target.value)}
                  required
                  className="w-full border border-stone/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                />
              </div>

              <div>
                <label className="block text-sm text-ink/70 mb-1">{t.date}</label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  required
                  className="w-full border border-stone/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                />
              </div>

              <div>
                <label className="block text-sm text-ink/70 mb-1">{t.notes}</label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-stone/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 resize-none"
                />
              </div>

              {submitError && (
                <p className="text-sm text-terracotta">{submitError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSubmitError(null);
                  }}
                  className="flex-1 text-sm border border-stone/50 rounded-lg py-2 text-ink/70 hover:bg-stone/10 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 text-sm bg-forest text-white rounded-lg py-2 hover:bg-forest/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "..." : t.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
