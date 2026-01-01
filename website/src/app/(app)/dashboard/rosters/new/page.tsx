"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRosterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      department: formData.get("department"),
    };

    try {
      const response = await fetch("/api/rosters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push("/dashboard/rosters");
      }
    } catch {
      console.error("Failed to create roster");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/rosters"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          Back to Rosters
        </Link>
        <h1 className="font-display text-4xl mb-2">Create New Roster</h1>
        <p className="text-ink/60">Set up a new work schedule for your team</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <h2 className="font-display text-xl mb-6">Roster Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Roster Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g., Week 5 Schedule"
                className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  defaultValue={today}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  required
                  defaultValue={nextWeek}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Department (Optional)</label>
              <select
                name="department"
                className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              >
                <option value="">All Departments</option>
                <option value="sales">Sales</option>
                <option value="operations">Operations</option>
                <option value="support">Support</option>
                <option value="engineering">Engineering</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-info-circle text-ocean" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">14-Day Publication Rule</h3>
              <p className="text-ink/60 text-sm">
                According to Norwegian labor law, rosters must be published at least 14 days before
                they take effect. Roaster will help you track this deadline and notify employees automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/rosters"
            className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus" />
                Create Roster
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
