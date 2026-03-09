"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ProtectedWorkerSummary {
  youngWorkerCount: number;
  youngWorkerViolations: number;
  pregnantWorkerCount: number;
  pregnantNightShiftViolations: number;
  wtdOptOutCount: number;
  nightWorkersNeedingAssessment: number;
}

interface ProtectedWorkersData {
  summary: ProtectedWorkerSummary;
  note?: string;
}

export function ProtectedWorkersAlert() {
  const [data, setData] = useState<ProtectedWorkersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProtectedWorkers = async () => {
      try {
        const res = await fetch("/api/compliance/protected-workers");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch {
        // Silently fail — alert is non-critical
      } finally {
        setLoading(false);
      }
    };

    fetchProtectedWorkers();
  }, []);

  if (loading || !data) return null;

  // If migration note is present, show info banner
  if (data.note) {
    return (
      <div className="bg-gold/10 text-gold border border-gold/20 rounded-2xl p-4 flex items-start gap-3">
        <i className="fas fa-shield-alt text-lg mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">{data.note}</p>
        </div>
      </div>
    );
  }

  const { summary } = data;
  const totalViolations =
    summary.youngWorkerViolations + summary.pregnantNightShiftViolations;
  const hasAssessmentsDue = summary.nightWorkersNeedingAssessment > 0;

  // No issues — render nothing
  if (totalViolations === 0 && !hasAssessmentsDue) return null;

  return (
    <div className="space-y-3">
      {/* Violation alert (terracotta) */}
      {totalViolations > 0 && (
        <div className="bg-terracotta/10 text-terracotta border border-terracotta/20 rounded-2xl p-4 flex items-start gap-3">
          <i className="fas fa-shield-alt text-lg mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              Protected Workers: {totalViolations}{" "}
              {totalViolations === 1 ? "violation" : "violations"} found —
              review required
            </p>
            <div className="mt-1 text-xs space-y-0.5 opacity-80">
              {summary.youngWorkerViolations > 0 && (
                <p>
                  {summary.youngWorkerCount} young worker
                  {summary.youngWorkerCount !== 1 ? "s" : ""} with{" "}
                  {summary.youngWorkerViolations} violation
                  {summary.youngWorkerViolations !== 1 ? "s" : ""}
                </p>
              )}
              {summary.pregnantNightShiftViolations > 0 && (
                <p>
                  {summary.pregnantWorkerCount} pregnant/nursing worker
                  {summary.pregnantWorkerCount !== 1 ? "s" : ""} with{" "}
                  {summary.pregnantNightShiftViolations} night shift violation
                  {summary.pregnantNightShiftViolations !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Link
              href="/dashboard/reports/compliance"
              className="inline-block mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
            >
              View details
            </Link>
          </div>
        </div>
      )}

      {/* Assessment warning (gold) */}
      {hasAssessmentsDue && (
        <div className="bg-gold/10 text-gold border border-gold/20 rounded-2xl p-4 flex items-start gap-3">
          <i className="fas fa-shield-alt text-lg mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              Night Worker Assessments: {summary.nightWorkersNeedingAssessment}{" "}
              assessment{summary.nightWorkersNeedingAssessment !== 1 ? "s" : ""}{" "}
              overdue
            </p>
            <p className="mt-1 text-xs opacity-80">
              Health assessments are required for all night workers (EU WTD Art
              9)
            </p>
            <Link
              href="/dashboard/reports/compliance"
              className="inline-block mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
            >
              View details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
