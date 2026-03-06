import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.overtimeReportTitle };
}

export default async function OvertimeReportPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.reports;

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
        <h1 className="font-display text-4xl mb-2">{d.overtimeReportTitle}</h1>
        <p className="text-ink/60">{d.overtimeReportSubtitle}</p>
      </div>

      {/* Overtime Limits Info */}
      <div className="bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6">
        <h3 className="font-semibold mb-3">{d.overtimeLimits}</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-week text-ocean" />
            </div>
            <div>
              <p className="font-medium">{d.hoursPerWeek}</p>
              <p className="text-ink/60">{d.weeklyLimit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-alt text-ocean" />
            </div>
            <div>
              <p className="font-medium">{d.hoursPerMonth}</p>
              <p className="text-ink/60">{d.monthlyLimit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar text-ocean" />
            </div>
            <div>
              <p className="font-medium">{d.hoursPerYear}</p>
              <p className="text-ink/60">{d.annualLimit}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">{d.thisWeekOvertime}</p>
          <div className="mt-2 h-2 bg-stone/20 rounded-full overflow-hidden">
            <div className="h-full bg-forest" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-ink/40 mt-1">{d.ofWeeklyLimit}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">{d.thisMonthOvertime}</p>
          <div className="mt-2 h-2 bg-stone/20 rounded-full overflow-hidden">
            <div className="h-full bg-forest" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-ink/40 mt-1">{d.ofMonthlyLimit}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">{d.thisYearOvertime}</p>
          <div className="mt-2 h-2 bg-stone/20 rounded-full overflow-hidden">
            <div className="h-full bg-forest" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-ink/40 mt-1">{d.ofAnnualLimit}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0</p>
          <p className="text-ink/60 text-sm">{d.employeesAtRisk}</p>
          <p className="text-xs text-ink/40 mt-2">{d.approachingLimits}</p>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.overtimeByEmployee}</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            {d.exportReport}
          </button>
        </div>

        <div className="text-center py-12 text-ink/60">
          <i className="fas fa-hourglass-half text-4xl mb-4 text-stone" />
          <p>{d.noOvertimeData}</p>
          <p className="text-sm">{d.noOvertimeDataHint}</p>
        </div>
      </div>
    </div>
  );
}
