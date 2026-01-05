"use client";

import { useState } from "react";

interface AutoScheduleModalProps {
  rosterId: string;
  rosterName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (jobId: string) => void;
}

type PriorityMode = "LOWEST_COST" | "EQUAL_HOURS" | "PREFERENCE_BASED";

const priorityModes: {
  value: PriorityMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "LOWEST_COST",
    label: "Lowest Cost",
    description:
      "Minimize labor expenses by prioritizing lower-rate employees and avoiding overtime",
    icon: "fa-coins",
  },
  {
    value: "EQUAL_HOURS",
    label: "Equal Hours",
    description:
      "Distribute hours fairly across all employees for equitable scheduling",
    icon: "fa-balance-scale",
  },
  {
    value: "PREFERENCE_BASED",
    label: "Preference Based",
    description:
      "Maximize employee satisfaction by prioritizing their shift preferences",
    icon: "fa-heart",
  },
];

export function AutoScheduleModal({
  rosterId,
  rosterName,
  isOpen,
  onClose,
  onSuccess,
}: AutoScheduleModalProps) {
  const [selectedMode, setSelectedMode] = useState<PriorityMode>("EQUAL_HOURS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/scheduling/auto-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rosterId,
          priorityMode: selectedMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start auto-scheduling");
      }

      onSuccess(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-stone/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">AI Auto-Schedule</h2>
              <p className="text-ink/60 text-sm mt-1">{rosterName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-cream flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times text-ink/60" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-ink/70 mb-6">
            Select a scheduling priority. Our AI will generate an optimal
            schedule evaluated by 4 specialized agents for compliance, cost,
            fairness, and operations.
          </p>

          {/* Priority Mode Selection */}
          <div className="space-y-3">
            {priorityModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setSelectedMode(mode.value)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedMode === mode.value
                    ? "border-ocean bg-ocean/5"
                    : "border-stone/30 hover:border-ocean/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedMode === mode.value
                        ? "bg-ocean/10 text-ocean"
                        : "bg-stone/20 text-ink/60"
                    }`}
                  >
                    <i className={`fas ${mode.icon}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{mode.label}</span>
                      {selectedMode === mode.value && (
                        <i className="fas fa-check text-ocean text-sm" />
                      )}
                    </div>
                    <p className="text-sm text-ink/60 mt-1">
                      {mode.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-terracotta/10 border border-terracotta/30 rounded-xl text-terracotta text-sm">
              <i className="fas fa-exclamation-circle mr-2" />
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-ocean/5 border border-ocean/20 rounded-xl">
            <div className="flex items-start gap-3">
              <i className="fas fa-robot text-ocean mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-ink">Multi-Agent Consensus</p>
                <p className="text-ink/60 mt-1">
                  The generated schedule will be reviewed by 4 AI agents:
                  Compliance, Cost, Employee Advocate, and Operations. You can
                  review their analysis before applying.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic" />
                Generate Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
