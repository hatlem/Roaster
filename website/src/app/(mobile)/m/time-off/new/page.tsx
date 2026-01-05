"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TIME_OFF_TYPES = [
  { value: "VACATION", label: "Vacation", icon: "fa-umbrella-beach" },
  { value: "SICK", label: "Sick Leave", icon: "fa-thermometer-half" },
  { value: "PERSONAL", label: "Personal Day", icon: "fa-user" },
  { value: "PARENTAL", label: "Parental Leave", icon: "fa-baby" },
  { value: "BEREAVEMENT", label: "Bereavement", icon: "fa-heart" },
  { value: "OTHER", label: "Other", icon: "fa-ellipsis-h" },
];

export default function NewTimeOffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "VACATION",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mobile/time-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request");
      }

      router.push("/m/time-off");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, diff + 1);
  };

  const days = calculateDays();

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/m/time-off"
          className="w-10 h-10 bg-white rounded-xl border border-stone/30 flex items-center justify-center"
        >
          <i className="fas fa-arrow-left text-ink/60" />
        </Link>
        <div>
          <h1 className="font-display text-2xl">Request Time Off</h1>
          <p className="text-ink/60 text-sm">Submit a new request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_OFF_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: type.value }))
                }
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.type === type.value
                    ? "border-ocean bg-ocean/10 text-ocean"
                    : "border-stone/30 bg-white"
                }`}
              >
                <i className={`fas ${type.icon} text-lg mb-1`} />
                <p className="text-xs">{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startDate: e.target.value }))
              }
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-white border border-stone/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ocean/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endDate: e.target.value }))
              }
              min={formData.startDate || new Date().toISOString().split("T")[0]}
              className="w-full bg-white border border-stone/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ocean/50"
            />
          </div>
        </div>

        {/* Duration Display */}
        {days > 0 && (
          <div className="bg-ocean/10 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-ink/60">Duration</span>
            <span className="font-display text-ocean">
              {days} day{days !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Reason <span className="text-ink/40">(optional)</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, reason: e.target.value }))
            }
            placeholder="Add a note for your manager..."
            rows={3}
            className="w-full bg-white border border-stone/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ocean/50 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-terracotta">
              <i className="fas fa-exclamation-circle" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || days === 0}
          className="w-full bg-ocean text-white rounded-xl py-4 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" />
              Submitting...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane" />
              Submit Request
            </>
          )}
        </button>
      </form>
    </div>
  );
}
