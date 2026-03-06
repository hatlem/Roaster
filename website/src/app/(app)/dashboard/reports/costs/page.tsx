import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.costsTitle };
}

export default async function CostsReportPage() {
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
        <h1 className="font-display text-4xl mb-2">{d.costsTitle}</h1>
        <p className="text-ink/60">{d.costsSubtitle}</p>
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
              <option value="custom">{d.customRange}</option>
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
          <p className="text-3xl font-display">0 kr</p>
          <p className="text-ink/60 text-sm">{d.scheduledCost}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0 kr</p>
          <p className="text-ink/60 text-sm">{d.actualCost}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0 kr</p>
          <p className="text-ink/60 text-sm">{d.variance}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-gold">0 kr</p>
          <p className="text-ink/60 text-sm">{d.overtimeCosts}</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-4">{d.costByDepartment}</h2>
          <div className="text-center py-8 text-ink/60">
            <i className="fas fa-chart-pie text-4xl mb-4 text-stone" />
            <p>{d.noCostData}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-4">{d.costTrend}</h2>
          <div className="text-center py-8 text-ink/60">
            <i className="fas fa-chart-line text-4xl mb-4 text-stone" />
            <p>{d.noTrendData}</p>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.detailedBreakdown}</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            {d.exportExcel}
          </button>
        </div>

        <div className="text-center py-12 text-ink/60">
          <i className="fas fa-coins text-4xl mb-4 text-stone" />
          <p>{d.noLaborCostData}</p>
          <p className="text-sm">{d.noLaborCostDataHint}</p>
        </div>
      </div>
    </div>
  );
}
