"use client";

import { useState, useEffect } from "react";

interface AgentEvaluation {
  agentName: string;
  recommendation: string;
  score: number;
  reasoning: string[];
  concerns: string[];
  suggestions: string[];
}

interface ConsensusDetails {
  status: string;
  finalDecision: string;
  summary: string;
  keyReasons: string[];
  remainingConcerns: string[];
  conditions: string[];
  agentEvaluations: AgentEvaluation[];
}

interface ScheduleMetrics {
  totalCost: number;
  coverageScore: number;
  preferenceScore: number;
  complianceScore: number;
  overtimeHours: number;
  shiftCount: number;
}

interface ProposedShift {
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  estimatedCost: number;
  preferenceScore: number;
  complianceScore: number;
}

interface JobData {
  id: string;
  status: string;
  priorityMode: string;
  generatedShifts: ProposedShift[] | null;
  metrics: ScheduleMetrics | null;
  consensusScore: number | null;
  consensusDetails: ConsensusDetails | null;
  errorMessage: string | null;
}

interface ScheduleReviewPanelProps {
  jobId: string;
  onApply: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function ScheduleReviewPanel({
  jobId,
  onApply,
  onReject,
  onClose,
}: ScheduleReviewPanelProps) {
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"shifts" | "agents" | "metrics">(
    "shifts"
  );

  // Poll for job status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/scheduling/jobs/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch job");
        }

        setJob(data);

        // Stop polling if job is complete or failed
        if (data.status !== "PENDING" && data.status !== "PROCESSING") {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        clearInterval(interval);
        setLoading(false);
      }
    };

    fetchJob();
    interval = setInterval(fetchJob, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const response = await fetch(`/api/scheduling/jobs/${jobId}/apply`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to apply schedule");
      }

      onApply();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    setRejecting(true);
    try {
      const response = await fetch(`/api/scheduling/jobs/${jobId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject schedule");
      }

      onReject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setRejecting(false);
      setShowRejectModal(false);
    }
  };

  // Loading state
  if (loading || !job || job.status === "PENDING" || job.status === "PROCESSING") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-robot text-ocean text-2xl animate-pulse" />
          </div>
          <h2 className="font-display text-xl mb-2">Generating Schedule</h2>
          <p className="text-ink/60 mb-6">
            Our AI agents are working to create an optimal schedule...
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-ocean rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 bg-ocean rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 bg-ocean rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (job.status === "FAILED" || error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-terracotta text-2xl" />
          </div>
          <h2 className="font-display text-xl mb-2">Generation Failed</h2>
          <p className="text-ink/60 mb-6">
            {job.errorMessage || error || "An error occurred while generating the schedule."}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const consensus = job.consensusDetails;
  const metrics = job.metrics;
  const shifts = job.generatedShifts || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">Review Generated Schedule</h2>
              <p className="text-ink/60 text-sm mt-1">
                {job.priorityMode.replace("_", " ")} priority
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-cream flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times text-ink/60" />
            </button>
          </div>

          {/* Consensus Summary */}
          {consensus && (
            <div className={`mt-4 p-4 rounded-xl border ${
              consensus.finalDecision === "approve"
                ? "bg-forest/5 border-forest/30"
                : consensus.finalDecision === "reject"
                  ? "bg-terracotta/5 border-terracotta/30"
                  : "bg-gold/5 border-gold/30"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  consensus.finalDecision === "approve"
                    ? "bg-forest/10"
                    : consensus.finalDecision === "reject"
                      ? "bg-terracotta/10"
                      : "bg-gold/10"
                }`}>
                  <i className={`fas ${
                    consensus.finalDecision === "approve"
                      ? "fa-check text-forest"
                      : consensus.finalDecision === "reject"
                        ? "fa-times text-terracotta"
                        : "fa-question text-gold"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    Consensus: {consensus.status.replace("_", " ")}
                  </p>
                  <p className="text-sm text-ink/60">{consensus.summary}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display">{job.consensusScore}%</p>
                  <p className="text-xs text-ink/60">Score</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-stone/30 px-6 flex-shrink-0">
          <div className="flex gap-6">
            {(["shifts", "agents", "metrics"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? "border-ocean text-ocean"
                    : "border-transparent text-ink/60 hover:text-ink"
                }`}
              >
                {tab === "shifts" && <><i className="fas fa-calendar-alt mr-2" />Shifts ({shifts.length})</>}
                {tab === "agents" && <><i className="fas fa-robot mr-2" />Agent Analysis</>}
                {tab === "metrics" && <><i className="fas fa-chart-bar mr-2" />Metrics</>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Shifts Tab */}
          {activeTab === "shifts" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream border-b border-stone/50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-sm">Employee</th>
                    <th className="text-left p-3 font-semibold text-sm">Date</th>
                    <th className="text-left p-3 font-semibold text-sm">Time</th>
                    <th className="text-left p-3 font-semibold text-sm">Cost</th>
                    <th className="text-left p-3 font-semibold text-sm">Scores</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift, idx) => (
                    <tr key={idx} className="border-b border-stone/30">
                      <td className="p-3">{shift.employeeName}</td>
                      <td className="p-3 text-ink/60">
                        {new Date(shift.date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="p-3">
                        {shift.startTime} - {shift.endTime}
                      </td>
                      <td className="p-3 text-ink/60">
                        {shift.estimatedCost.toLocaleString()} NOK
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            shift.preferenceScore >= 70
                              ? "bg-forest/10 text-forest"
                              : shift.preferenceScore >= 40
                                ? "bg-gold/10 text-gold"
                                : "bg-terracotta/10 text-terracotta"
                          }`}>
                            Pref: {shift.preferenceScore}%
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            shift.complianceScore >= 80
                              ? "bg-forest/10 text-forest"
                              : shift.complianceScore >= 60
                                ? "bg-gold/10 text-gold"
                                : "bg-terracotta/10 text-terracotta"
                          }`}>
                            Comp: {shift.complianceScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === "agents" && consensus && (
            <div className="space-y-4">
              {consensus.agentEvaluations.map((agent, idx) => (
                <div
                  key={idx}
                  className="border border-stone/30 rounded-xl overflow-hidden"
                >
                  <div className="p-4 bg-cream flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        agent.score >= 80
                          ? "bg-forest/10 text-forest"
                          : agent.score >= 60
                            ? "bg-gold/10 text-gold"
                            : "bg-terracotta/10 text-terracotta"
                      }`}>
                        <i className={`fas ${
                          agent.agentName.includes("Compliance")
                            ? "fa-shield-alt"
                            : agent.agentName.includes("Cost")
                              ? "fa-coins"
                              : agent.agentName.includes("Employee")
                                ? "fa-users"
                                : "fa-cogs"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold">{agent.agentName}</p>
                        <p className="text-xs text-ink/60">
                          {agent.recommendation.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display">{agent.score}%</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {agent.reasoning.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-forest mb-1">
                          <i className="fas fa-check-circle mr-1" />
                          Reasoning
                        </p>
                        <ul className="text-sm text-ink/70 space-y-1">
                          {agent.reasoning.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {agent.concerns.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-terracotta mb-1">
                          <i className="fas fa-exclamation-circle mr-1" />
                          Concerns
                        </p>
                        <ul className="text-sm text-ink/70 space-y-1">
                          {agent.concerns.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {agent.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-ocean mb-1">
                          <i className="fas fa-lightbulb mr-1" />
                          Suggestions
                        </p>
                        <ul className="text-sm text-ink/70 space-y-1">
                          {agent.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === "metrics" && metrics && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-forest/5 rounded-xl p-4 border border-forest/20">
                <p className="text-2xl font-display text-forest">
                  {Math.round(metrics.complianceScore)}%
                </p>
                <p className="text-sm text-ink/60">Compliance Score</p>
              </div>
              <div className="bg-ocean/5 rounded-xl p-4 border border-ocean/20">
                <p className="text-2xl font-display text-ocean">
                  {Math.round(metrics.coverageScore)}%
                </p>
                <p className="text-sm text-ink/60">Coverage Score</p>
              </div>
              <div className="bg-gold/5 rounded-xl p-4 border border-gold/20">
                <p className="text-2xl font-display text-gold">
                  {Math.round(metrics.preferenceScore)}%
                </p>
                <p className="text-sm text-ink/60">Preference Score</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-stone/30">
                <p className="text-2xl font-display">
                  {metrics.totalCost.toLocaleString()} NOK
                </p>
                <p className="text-sm text-ink/60">Estimated Total Cost</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-stone/30">
                <p className="text-2xl font-display">{metrics.shiftCount}</p>
                <p className="text-sm text-ink/60">Total Shifts</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-stone/30">
                <p className="text-2xl font-display">{metrics.overtimeHours}h</p>
                <p className="text-sm text-ink/60">Overtime Hours</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone/30 flex justify-between flex-shrink-0">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={applying}
            className="px-5 py-2.5 rounded-xl border border-terracotta text-terracotta font-medium hover:bg-terracotta/5 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-times mr-2" />
            Reject & Regenerate
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={applying}
              className="px-5 py-2.5 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-5 py-2.5 rounded-xl bg-forest text-white font-medium hover:bg-forest/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {applying ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <i className="fas fa-check" />
                  Apply Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-xl mb-4">Reject Schedule</h3>
            <p className="text-ink/60 mb-4">
              Please provide a reason for rejecting this schedule. You can
              regenerate with different parameters.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={rejecting}
                className="px-5 py-2.5 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50"
              >
                {rejecting ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
