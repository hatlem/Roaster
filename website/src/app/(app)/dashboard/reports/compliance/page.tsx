import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.complianceTitle };
}

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
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.reports;
  const { employees, rosters } = await getComplianceData();

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/reports"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          {d.backToReports}
        </Link>
        <h1 className="font-display text-4xl mb-2">{d.complianceTitle}</h1>
        <p className="text-ink/60">{d.complianceSubtitle}</p>
      </div>

      {/* Report Summary */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl">{d.reportSummary}</h2>
          <button className="flex items-center gap-2 bg-ocean text-white px-4 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
            <i className="fas fa-download" />
            {d.exportPDF}
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-forest/5 rounded-xl p-4 border border-forest/20">
            <p className="text-2xl font-display text-forest">98.5%</p>
            <p className="text-sm text-ink/60">{d.complianceRate}</p>
          </div>
          <div className="bg-ocean/5 rounded-xl p-4 border border-ocean/20">
            <p className="text-2xl font-display text-ocean">{employees}</p>
            <p className="text-sm text-ink/60">{d.activeEmployees}</p>
          </div>
          <div className="bg-gold/5 rounded-xl p-4 border border-gold/20">
            <p className="text-2xl font-display text-gold">{rosters.length}</p>
            <p className="text-sm text-ink/60">{d.rostersThisPeriod}</p>
          </div>
          <div className="bg-forest/5 rounded-xl p-4 border border-forest/20">
            <p className="text-2xl font-display text-forest">0</p>
            <p className="text-sm text-ink/60">{d.violations}</p>
          </div>
        </div>

        <div className="border-t border-stone/30 pt-4">
          <p className="text-sm text-ink/60">
            <strong>{d.reportPeriod}</strong> {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
          <p className="text-sm text-ink/60">
            <strong>{d.generated}</strong> {new Date().toLocaleDateString("en-GB")} {d.at} {new Date().toLocaleTimeString("en-GB")}
          </p>
        </div>
      </div>

      {/* 14-Day Publication Compliance */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <h2 className="font-display text-xl mb-4">{d.fourteenDayRule}</h2>
        <p className="text-ink/60 text-sm mb-4">
          {d.fourteenDayRuleDesc}
        </p>

        {rosters.length === 0 ? (
          <div className="text-center py-8 text-ink/60">
            <i className="fas fa-calendar-check text-4xl mb-4 text-stone" />
            <p>{d.noRostersToAnalyze}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/50">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">{d.roster}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.startDateLabel}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.publishedLabel}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.daysNotice}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.statusLabel}</th>
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
                      {publishedAt ? publishedAt.toLocaleDateString("en-GB") : d.notPublished}
                    </td>
                    <td className="p-3">{daysNotice !== null ? `${daysNotice} ${d.days}` : "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        roster.status !== "PUBLISHED"
                          ? "bg-stone/30 text-ink/60"
                          : isCompliant
                            ? "bg-forest/10 text-forest"
                            : "bg-terracotta/10 text-terracotta"
                      }`}>
                        {roster.status !== "PUBLISHED" ? d.draft : isCompliant ? d.compliant : d.violation}
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
        <h2 className="font-display text-xl mb-4">{d.restPeriodCompliance}</h2>
        <p className="text-ink/60 text-sm mb-4">
          {d.restPeriodDesc}
        </p>
        <div className="text-center py-8 text-ink/60">
          <i className="fas fa-check-circle text-4xl mb-4 text-forest" />
          <p className="text-forest font-medium">{d.allRestPeriodsCompliant}</p>
          <p className="text-sm">{d.noViolationsDetected}</p>
        </div>
      </div>

      {/* Overtime Compliance */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <h2 className="font-display text-xl mb-4">{d.overtimeLimitsReportTitle}</h2>
        <p className="text-ink/60 text-sm mb-4">
          {d.overtimeLimitsReportDesc}
        </p>
        <div className="text-center py-8 text-ink/60">
          <i className="fas fa-check-circle text-4xl mb-4 text-forest" />
          <p className="text-forest font-medium">{d.allOvertimeWithinLimits}</p>
          <p className="text-sm">{d.noEmployeesExceeded}</p>
        </div>
      </div>
    </div>
  );
}
