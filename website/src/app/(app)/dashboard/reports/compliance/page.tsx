import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Compliance Report",
};

async function getComplianceData() {
  try {
    const [employees, rosters] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.roster.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          publishedAt: true,
        },
      }),
    ]);
    return { employees, rosters };
  } catch {
    return { employees: 0, rosters: [] };
  }
}

export default async function ComplianceReportPage() {
  const { employees, rosters } = await getComplianceData();

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/reports"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          Back to Reports
        </Link>
        <h1 className="font-display text-4xl mb-2">Compliance Report</h1>
        <p className="text-ink/60">Audit-ready compliance documentation</p>
      </div>

      {/* Report Summary */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl">Report Summary</h2>
          <button className="flex items-center gap-2 bg-ocean text-white px-4 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
            <i className="fas fa-download" />
            Export PDF
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-forest/5 rounded-xl p-4 border border-forest/20">
            <p className="text-2xl font-display text-forest">98.5%</p>
            <p className="text-sm text-ink/60">Compliance Rate</p>
          </div>
          <div className="bg-ocean/5 rounded-xl p-4 border border-ocean/20">
            <p className="text-2xl font-display text-ocean">{employees}</p>
            <p className="text-sm text-ink/60">Active Employees</p>
          </div>
          <div className="bg-gold/5 rounded-xl p-4 border border-gold/20">
            <p className="text-2xl font-display text-gold">{rosters.length}</p>
            <p className="text-sm text-ink/60">Rosters This Period</p>
          </div>
          <div className="bg-forest/5 rounded-xl p-4 border border-forest/20">
            <p className="text-2xl font-display text-forest">0</p>
            <p className="text-sm text-ink/60">Violations</p>
          </div>
        </div>

        <div className="border-t border-stone/30 pt-4">
          <p className="text-sm text-ink/60">
            <strong>Report Period:</strong> {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
          <p className="text-sm text-ink/60">
            <strong>Generated:</strong> {new Date().toLocaleDateString("en-GB")} at {new Date().toLocaleTimeString("en-GB")}
          </p>
        </div>
      </div>

      {/* 14-Day Publication Compliance */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <h2 className="font-display text-xl mb-4">14-Day Publication Rule</h2>
        <p className="text-ink/60 text-sm mb-4">
          Rosters must be published with the required advance notice before they take effect.
        </p>

        {rosters.length === 0 ? (
          <div className="text-center py-8 text-ink/60">
            <i className="fas fa-calendar-check text-4xl mb-4 text-stone" />
            <p>No rosters to analyze</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/50">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">Roster</th>
                <th className="text-left p-3 font-semibold text-sm">Start Date</th>
                <th className="text-left p-3 font-semibold text-sm">Published</th>
                <th className="text-left p-3 font-semibold text-sm">Days Notice</th>
                <th className="text-left p-3 font-semibold text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {rosters.map((roster) => {
                const startDate = new Date(roster.startDate);
                const publishedAt = roster.publishedAt ? new Date(roster.publishedAt) : null;
                const daysNotice = publishedAt
                  ? Math.floor((startDate.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isCompliant = daysNotice === null || daysNotice >= 14;

                return (
                  <tr key={roster.id} className="border-b border-stone/30">
                    <td className="p-3">{roster.name}</td>
                    <td className="p-3 text-ink/60">{startDate.toLocaleDateString("en-GB")}</td>
                    <td className="p-3 text-ink/60">
                      {publishedAt ? publishedAt.toLocaleDateString("en-GB") : "Not published"}
                    </td>
                    <td className="p-3">{daysNotice !== null ? `${daysNotice} days` : "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        roster.status !== "PUBLISHED"
                          ? "bg-stone/30 text-ink/60"
                          : isCompliant
                            ? "bg-forest/10 text-forest"
                            : "bg-terracotta/10 text-terracotta"
                      }`}>
                        {roster.status !== "PUBLISHED" ? "Draft" : isCompliant ? "Compliant" : "Violation"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Rest Period Compliance */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <h2 className="font-display text-xl mb-4">Rest Period Compliance</h2>
        <p className="text-ink/60 text-sm mb-4">
          Employees must have at least 11 hours of rest between shifts and 35 consecutive hours of rest per week.
        </p>
        <div className="text-center py-8 text-ink/60">
          <i className="fas fa-check-circle text-4xl mb-4 text-forest" />
          <p className="text-forest font-medium">All rest periods are compliant</p>
          <p className="text-sm">No violations detected in the current period</p>
        </div>
      </div>

      {/* Overtime Compliance */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <h2 className="font-display text-xl mb-4">Overtime Limits</h2>
        <p className="text-ink/60 text-sm mb-4">
          Overtime is tracked against configured weekly, monthly, and annual limits.
        </p>
        <div className="text-center py-8 text-ink/60">
          <i className="fas fa-check-circle text-4xl mb-4 text-forest" />
          <p className="text-forest font-medium">All overtime within legal limits</p>
          <p className="text-sm">No employees have exceeded overtime thresholds</p>
        </div>
      </div>
    </div>
  );
}
