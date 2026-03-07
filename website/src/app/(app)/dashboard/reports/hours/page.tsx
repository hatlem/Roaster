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
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-1">{d.hoursTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-2">{d.hoursSubtitle}</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-stone/10 rounded-2xl p-6 border border-stone/30 mb-6 animate-fade-up delay-2">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{d.startDate}</label>
            <input
              type="date"
              className="px-4 py-2 bg-white border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.endDate}</label>
            <input
              type="date"
              className="px-4 py-2 bg-white border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
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
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ocean to-ocean/40" />
          <p className="text-3xl font-display">0h</p>
          <p className="text-ink/60 text-sm">{d.totalScheduled}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-terracotta to-gold" />
          <p className="text-3xl font-display">0h</p>
          <p className="text-ink/60 text-sm">{d.totalWorked}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-forest/40" />
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">{d.overtimeLabel}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-6">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold to-gold/40" />
          <p className="text-3xl font-display">0</p>
          <p className="text-ink/60 text-sm">{d.employees}</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.hoursByEmployee}</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            {d.exportCSV}
          </button>
        </div>

        {/* CSS-only bar chart placeholder + empty state */}
        <div className="flex flex-col items-center py-10">
          {/* Bar chart placeholder */}
          <div className="flex items-end gap-3 mb-6 h-24">
            <div className="w-8 bg-stone/15 rounded-t-md" style={{ height: "40%" }} />
            <div className="w-8 bg-stone/20 rounded-t-md" style={{ height: "70%" }} />
            <div className="w-8 bg-stone/15 rounded-t-md" style={{ height: "55%" }} />
            <div className="w-8 bg-stone/20 rounded-t-md" style={{ height: "90%" }} />
            <div className="w-8 bg-stone/15 rounded-t-md" style={{ height: "30%" }} />
          </div>
          <div className="w-[184px] h-px bg-stone/30 mb-6" />
          <p className="text-ink/60 font-medium mb-1">{d.noHoursData}</p>
          <p className="text-ink/40 text-sm">{d.noHoursDataHint}</p>
        </div>
      </div>
    </div>
  );
}
