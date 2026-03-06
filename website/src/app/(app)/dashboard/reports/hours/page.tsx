import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.hoursTitle };
}

export default async function HoursReportPage() {
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
        <h1 className="font-display text-4xl mb-2">{d.hoursTitle}</h1>
        <p className="text-ink/60">{d.hoursSubtitle}</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{d.startDate}</label>
            <input
              type="date"
              className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.endDate}</label>
            <input
              type="date"
              className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
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
          <p className="text-3xl font-display">0h</p>
          <p className="text-ink/60 text-sm">{d.totalScheduled}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0h</p>
          <p className="text-ink/60 text-sm">{d.totalWorked}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">{d.overtimeLabel}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0</p>
          <p className="text-ink/60 text-sm">{d.employees}</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.hoursByEmployee}</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            {d.exportCSV}
          </button>
        </div>

        <div className="text-center py-12 text-ink/60">
          <i className="fas fa-clock text-4xl mb-4 text-stone" />
          <p>{d.noHoursData}</p>
          <p className="text-sm">{d.noHoursDataHint}</p>
        </div>
      </div>
    </div>
  );
}
