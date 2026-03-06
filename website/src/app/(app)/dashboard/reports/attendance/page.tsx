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
      <div className="mb-8">
        <Link
          href="/dashboard/reports"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          {d.backToReports}
        </Link>
        <h1 className="font-display text-4xl mb-2">{d.attendanceReportTitle}</h1>
        <p className="text-ink/60">{d.attendanceReportSubtitle}</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{d.period}</label>
            <select className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="week">{d.thisWeek}</option>
              <option value="month">{d.thisMonth}</option>
              <option value="quarter">{d.thisQuarter}</option>
              <option value="year">{d.thisYear}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.department}</label>
            <select className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
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
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">100%</p>
          <p className="text-ink/60 text-sm">{d.attendanceRate}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0</p>
          <p className="text-ink/60 text-sm">{d.scheduledShifts}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-gold">0</p>
          <p className="text-ink/60 text-sm">{d.absences}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-ocean">0</p>
          <p className="text-ink/60 text-sm">{d.timeOffDays}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-4">{d.absenceReasons}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-terracotta" />
                <span className="text-sm">{d.sickLeave}</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-ocean" />
                <span className="text-sm">{d.vacation}</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold" />
                <span className="text-sm">{d.personalLeave}</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-forest" />
                <span className="text-sm">{d.parentalLeave}</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-4">{d.attendanceTrend}</h2>
          <div className="text-center py-8 text-ink/60">
            <i className="fas fa-chart-line text-4xl mb-4 text-stone" />
            <p>{d.noTrendData}</p>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.attendanceByEmployee}</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            {d.exportReport}
          </button>
        </div>

        <div className="text-center py-12 text-ink/60">
          <i className="fas fa-user-check text-4xl mb-4 text-stone" />
          <p>{d.noAttendanceData}</p>
          <p className="text-sm">{d.noAttendanceDataHint}</p>
        </div>
      </div>
    </div>
  );
}
