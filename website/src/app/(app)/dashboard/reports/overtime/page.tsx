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

  const employeesAtRisk = 0;

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--terracotta), transparent)", opacity: 0.06 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/reports"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4 animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToReports}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-1">{d.overtimeReportTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-2">{d.overtimeReportSubtitle}</p>
        </div>
      </div>

      {/* Overtime Limits Info */}
      <div className="bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6 animate-fade-up delay-2">
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
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-gold" />
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">{d.thisWeekOvertime}</p>
          <div className="mt-2 h-2 bg-stone/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest to-gold rounded-full"
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-xs text-ink/40 mt-1">{d.ofWeeklyLimit}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-gold" />
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">{d.thisMonthOvertime}</p>
          <div className="mt-2 h-2 bg-stone/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest to-gold rounded-full"
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-xs text-ink/40 mt-1">{d.ofMonthlyLimit}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-gold" />
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">{d.thisYearOvertime}</p>
          <div className="mt-2 h-2 bg-stone/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest to-gold rounded-full"
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-xs text-ink/40 mt-1">{d.ofAnnualLimit}</p>
        </div>
        <div className={`relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-6 ${employeesAtRisk > 0 ? "animate-pulse" : ""}`}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-terracotta to-gold" />
          <p className={`text-3xl font-display ${employeesAtRisk > 0 ? "text-terracotta" : "text-forest"}`}>{employeesAtRisk}</p>
          <p className="text-ink/60 text-sm">{d.employeesAtRisk}</p>
          <p className="text-xs text-ink/40 mt-2">{d.approachingLimits}</p>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.overtimeByEmployee}</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            {d.exportReport}
          </button>
        </div>

        <div className="flex flex-col items-center py-10">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
            <i className="fas fa-hourglass-half text-2xl text-stone/60" />
          </div>
          <p className="text-ink/60 font-medium mb-1">{d.noOvertimeData}</p>
          <p className="text-ink/40 text-sm">{d.noOvertimeDataHint}</p>
        </div>
      </div>
    </div>
  );
}
