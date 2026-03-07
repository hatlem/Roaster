import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.attendanceReportTitle };
}

export default async function AttendanceReportPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.reports;

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--ocean), transparent)", opacity: 0.06 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/reports"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4 animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToReports}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-1">{d.attendanceReportTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-2">{d.attendanceReportSubtitle}</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-stone/10 rounded-2xl p-6 border border-stone/30 mb-6 animate-fade-up delay-2">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{d.period}</label>
            <select className="px-4 py-2 bg-white border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="week">{d.thisWeek}</option>
              <option value="month">{d.thisMonth}</option>
              <option value="quarter">{d.thisQuarter}</option>
              <option value="year">{d.thisYear}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.department}</label>
            <select className="px-4 py-2 bg-white border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="">{d.allDepartments}</option>
              <option value="sales">{d.deptSales}</option>
              <option value="operations">{d.deptOperations}</option>
              <option value="support">{d.deptSupport}</option>
            </select>
          </div>
          <button className="bg-ocean text-white px-6 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
            {d.generateReport}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-forest/40" />
          <p className="text-3xl font-display text-forest">100%</p>
          <p className="text-ink/60 text-sm">{d.attendanceRate}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ocean to-ocean/40" />
          <p className="text-3xl font-display">0</p>
          <p className="text-ink/60 text-sm">{d.scheduledShifts}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold to-gold/40" />
          <p className="text-3xl font-display text-gold">0</p>
          <p className="text-ink/60 text-sm">{d.absences}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-6">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ocean to-forest/40" />
          <p className="text-3xl font-display text-ocean">0</p>
          <p className="text-ink/60 text-sm">{d.timeOffDays}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-7">
          <h2 className="font-display text-xl mb-4">{d.absenceReasons}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-terracotta shadow-[0_0_8px_rgba(var(--terracotta-rgb,196,107,72),0.3)]" />
                <span className="text-sm">{d.sickLeave}</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-ocean shadow-[0_0_8px_rgba(var(--ocean-rgb,56,132,160),0.3)]" />
                <span className="text-sm">{d.vacation}</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gold shadow-[0_0_8px_rgba(var(--gold-rgb,199,163,83),0.3)]" />
                <span className="text-sm">{d.personalLeave}</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-forest shadow-[0_0_8px_rgba(var(--forest-rgb,76,127,93),0.3)]" />
                <span className="text-sm">{d.parentalLeave}</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-8">
          <h2 className="font-display text-xl mb-4">{d.attendanceTrend}</h2>
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
              <i className="fas fa-chart-line text-2xl text-stone/60" />
            </div>
            <p className="text-ink/60 font-medium mb-1">{d.noTrendData}</p>
            <p className="text-ink/40 text-sm">{d.noAttendanceDataHint || "Track attendance to see trends"}</p>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.attendanceByEmployee}</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            {d.exportReport}
          </button>
        </div>

        <div className="flex flex-col items-center py-10">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
            <i className="fas fa-user-check text-2xl text-stone/60" />
          </div>
          <p className="text-ink/60 font-medium mb-1">{d.noAttendanceData}</p>
          <p className="text-ink/40 text-sm">{d.noAttendanceDataHint}</p>
        </div>
      </div>
    </div>
  );
}
