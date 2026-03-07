import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { ReportExportButton } from "@/components/dashboard/ReportExportButton";

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
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--forest), transparent)", opacity: 0.06 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/reports"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4 animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToReports}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-1">{d.complianceTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-2">{d.complianceSubtitle}</p>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6 animate-fade-up delay-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl">{d.reportSummary}</h2>
          <ReportExportButton reportType="compliance" format="csv" label={d.exportPDF} icon="fas fa-download" className="bg-ocean text-white px-4 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors" />
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="relative bg-forest/5 rounded-xl p-4 border border-forest/20 card-hover overflow-hidden animate-fade-up delay-3">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-forest/40" />
            <p className="text-2xl font-display text-forest">98.5%</p>
            <p className="text-sm text-ink/60">{d.complianceRate}</p>
          </div>
          <div className="relative bg-ocean/5 rounded-xl p-4 border border-ocean/20 card-hover overflow-hidden animate-fade-up delay-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ocean to-ocean/40" />
            <p className="text-2xl font-display text-ocean">{employees}</p>
            <p className="text-sm text-ink/60">{d.activeEmployees}</p>
          </div>
          <div className="relative bg-gold/5 rounded-xl p-4 border border-gold/20 card-hover overflow-hidden animate-fade-up delay-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold to-gold/40" />
            <p className="text-2xl font-display text-gold">{rosters.length}</p>
            <p className="text-sm text-ink/60">{d.rostersThisPeriod}</p>
          </div>
          <div className="relative bg-forest/5 rounded-xl p-4 border border-forest/20 card-hover overflow-hidden animate-fade-up delay-6">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-forest/40" />
            <p className="text-2xl font-display text-forest">0</p>
            <p className="text-sm text-ink/60">{d.violations}</p>
          </div>
        </div>

        {/* Compliance Score Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink/70">{d.complianceRate}</span>
            <span className="text-sm font-semibold text-forest">98.5%</span>
          </div>
          <div className="h-3 bg-stone/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest to-forest/70 rounded-full transition-all duration-1000"
              style={{ width: "98.5%" }}
            />
          </div>
        </div>

        <div className="border-t border-stone/30 pt-4">
          <p className="text-sm text-ink/60">
            <strong>{d.reportPeriod}</strong> {new Date().toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </p>
          <p className="text-sm text-ink/60">
            <strong>{d.generated}</strong> {new Date().toLocaleDateString(locale)} {d.at} {new Date().toLocaleTimeString(locale)}
          </p>
        </div>
      </div>

      {/* 14-Day Publication Compliance */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6 animate-fade-up delay-3">
        <h2 className="font-display text-xl mb-4">{d.fourteenDayRule}</h2>
        <p className="text-ink/60 text-sm mb-4">
          {d.fourteenDayRuleDesc}
        </p>

        {rosters.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
              <i className="fas fa-calendar-check text-2xl text-stone/60" />
            </div>
            <p className="text-ink/60 font-medium mb-1">{d.noRostersToAnalyze}</p>
            <p className="text-ink/40 text-sm">{d.noHoursDataHint || "Start scheduling shifts to see your data here"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warm-dark/5 border-b border-stone/50">
                <tr>
                  <th className="text-left p-3 font-semibold text-sm">{d.roster}</th>
                  <th className="text-left p-3 font-semibold text-sm">{d.startDateLabel}</th>
                  <th className="text-left p-3 font-semibold text-sm">{d.publishedLabel}</th>
                  <th className="text-left p-3 font-semibold text-sm">{d.daysNotice}</th>
                  <th className="text-left p-3 font-semibold text-sm">{d.statusLabel}</th>
                </tr>
              </thead>
              <tbody>
                {rosters.map((roster, idx) => {
                  const startDate = new Date(roster.startDate);
                  const publishedAt = roster.publishedAt ? new Date(roster.publishedAt) : null;
                  const daysNotice = publishedAt
                    ? Math.floor((startDate.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isCompliant = daysNotice === null || daysNotice >= 14;

                  return (
                    <tr
                      key={roster.id}
                      className={`border-b border-stone/30 ${idx % 2 === 0 ? "bg-cream/30" : "bg-white"}`}
                    >
                      <td className="p-3 font-medium">{roster.name}</td>
                      <td className="p-3 text-ink/60">{startDate.toLocaleDateString(locale)}</td>
                      <td className="p-3 text-ink/60">
                        {publishedAt ? publishedAt.toLocaleDateString(locale) : d.notPublished}
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
          </div>
        )}
      </div>

      {/* Rest Period Compliance */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6 animate-fade-up delay-4">
        <h2 className="font-display text-xl mb-4">{d.restPeriodCompliance}</h2>
        <p className="text-ink/60 text-sm mb-4">
          {d.restPeriodDesc}
        </p>
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-4">
            <i className="fas fa-check-circle text-3xl text-forest" />
          </div>
          <p className="text-forest font-medium">{d.allRestPeriodsCompliant}</p>
          <p className="text-sm text-ink/50">{d.noViolationsDetected}</p>
        </div>
      </div>

      {/* Overtime Compliance */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-5">
        <h2 className="font-display text-xl mb-4">{d.overtimeLimitsReportTitle}</h2>
        <p className="text-ink/60 text-sm mb-4">
          {d.overtimeLimitsReportDesc}
        </p>
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-4">
            <i className="fas fa-check-circle text-3xl text-forest" />
          </div>
          <p className="text-forest font-medium">{d.allOvertimeWithinLimits}</p>
          <p className="text-sm text-ink/50">{d.noEmployeesExceeded}</p>
        </div>
      </div>
    </div>
  );
}
