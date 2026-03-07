import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { ReportExportButton } from "@/components/dashboard/ReportExportButton";
import { CostBreakdownChart } from "@/components/dashboard/ReportCharts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.costsTitle };
}

async function getCostsData(orgId: string) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const laborCosts = await prisma.laborCost.findMany({
      where: {
        roster: { organizationId: orgId },
        periodStart: { gte: startOfMonth },
        periodEnd: { lte: endOfMonth },
      },
    });

    const scheduledCost = laborCosts.reduce((sum, lc) => sum + Number(lc.scheduledCost), 0);
    const actualCost = laborCosts.reduce((sum, lc) => sum + Number(lc.actualCost || 0), 0);
    const variance = laborCosts.reduce((sum, lc) => sum + Number(lc.variance || 0), 0);
    const overtimeCost = laborCosts.reduce((sum, lc) => sum + Number(lc.scheduledOvertimeCost || 0), 0);

    return {
      scheduledCost: Math.round(scheduledCost * 100) / 100,
      actualCost: Math.round(actualCost * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      overtimeCost: Math.round(overtimeCost * 100) / 100,
      records: laborCosts,
    };
  } catch {
    return {
      scheduledCost: 0,
      actualCost: 0,
      variance: 0,
      overtimeCost: 0,
      records: [],
    };
  }
}

function formatCurrency(amount: number, locale: string): string {
  try {
    const currencyMap: Record<string, string> = {
      no: "NOK", nb: "NOK", nn: "NOK",
      da: "DKK",
      sv: "SEK",
      fi: "EUR",
      de: "EUR", "de-AT": "EUR", "de-CH": "CHF",
      fr: "EUR", "fr-BE": "EUR",
      nl: "EUR",
      es: "EUR",
      it: "EUR",
      pt: "EUR",
      pl: "PLN",
      en: "USD", "en-GB": "GBP", "en-IE": "EUR",
    };
    const currency = currencyMap[locale] || "EUR";
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount)}`;
  }
}

export default async function CostsReportPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as { organizationId?: string })?.organizationId;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.reports;

  const data = orgId ? await getCostsData(orgId) : null;
  const { scheduledCost, actualCost, variance, overtimeCost, records } = data || {
    scheduledCost: 0,
    actualCost: 0,
    variance: 0,
    overtimeCost: 0,
    records: [],
  };

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--gold), transparent)", opacity: 0.06 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/reports"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4 animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToReports}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-1">{d.costsTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-2">{d.costsSubtitle}</p>
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
              <option value="custom">{d.customRange}</option>
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
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ocean to-ocean/40" />
          <p className="text-3xl font-display">{formatCurrency(scheduledCost, locale)}</p>
          <p className="text-ink/60 text-sm">{d.scheduledCost}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-terracotta to-gold" />
          <p className="text-3xl font-display">{formatCurrency(actualCost, locale)}</p>
          <p className="text-ink/60 text-sm">{d.actualCost}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-forest/40" />
          <p className={`text-3xl font-display ${variance > 0 ? "text-terracotta" : "text-forest"}`}>{formatCurrency(variance, locale)}</p>
          <p className="text-ink/60 text-sm">{d.variance}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-6">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold to-gold/40" />
          <p className="text-3xl font-display text-gold">{formatCurrency(overtimeCost, locale)}</p>
          <p className="text-ink/60 text-sm">{d.overtimeCosts}</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-7">
          <h2 className="font-display text-xl mb-4">{d.costByDepartment}</h2>
          {scheduledCost > 0 || overtimeCost > 0 ? (
            <CostBreakdownChart
              data={[
                { name: d.scheduledCost, value: Math.round(scheduledCost - overtimeCost) },
                { name: d.overtimeCosts, value: Math.round(overtimeCost) },
                ...(actualCost > 0 && variance !== 0 ? [{ name: d.variance, value: Math.abs(Math.round(variance)) }] : []),
              ].filter(d => d.value > 0)}
              currency={formatCurrency(0, locale).replace(/[\d.,\s]/g, "")}
            />
          ) : (
            <div className="flex flex-col items-center py-8">
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-stone/30 flex items-center justify-center mb-4 relative">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-stone/20 flex items-center justify-center">
                  <i className="fas fa-chart-pie text-xl text-stone/40" />
                </div>
              </div>
              <p className="text-ink/60 font-medium mb-1">{d.noCostData}</p>
              <p className="text-ink/40 text-sm">{d.noLaborCostDataHint || "Add employee costs to see breakdown"}</p>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-8">
          <h2 className="font-display text-xl mb-4">{d.costTrend}</h2>
          {scheduledCost > 0 && actualCost > 0 ? (
            <CostBreakdownChart
              data={[
                { name: d.scheduledCost, value: Math.round(scheduledCost) },
                { name: d.actualCost, value: Math.round(actualCost) },
              ]}
              currency={formatCurrency(0, locale).replace(/[\d.,\s]/g, "")}
            />
          ) : (
            <div className="flex flex-col items-center py-8">
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-stone/30 flex items-center justify-center mb-4 relative">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-stone/20 flex items-center justify-center">
                  <i className="fas fa-chart-line text-xl text-stone/40" />
                </div>
              </div>
              <p className="text-ink/60 font-medium mb-1">{d.noTrendData}</p>
              <p className="text-ink/40 text-sm">{d.noLaborCostDataHint || "Schedule shifts to see cost trends"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.detailedBreakdown}</h2>
          <ReportExportButton reportType="costs" format="csv" label={d.exportExcel} icon="fas fa-download" className="border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors" />
        </div>

        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warm-dark/5 border-b border-stone/50">
                <tr>
                  <th className="text-left p-3 font-semibold text-sm">{d.period}</th>
                  <th className="text-right p-3 font-semibold text-sm">{d.scheduledCost}</th>
                  <th className="text-right p-3 font-semibold text-sm">{d.actualCost}</th>
                  <th className="text-right p-3 font-semibold text-sm">{d.variance}</th>
                  <th className="text-right p-3 font-semibold text-sm">{d.overtimeCosts}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={record.id} className={`border-b border-stone/30 ${idx % 2 === 0 ? "bg-cream/30" : "bg-white"}`}>
                    <td className="p-3 font-medium">{record.period}</td>
                    <td className="p-3 text-right">{formatCurrency(Number(record.scheduledCost), locale)}</td>
                    <td className="p-3 text-right">{formatCurrency(Number(record.actualCost || 0), locale)}</td>
                    <td className="p-3 text-right">
                      <span className={Number(record.variance || 0) > 0 ? "text-terracotta" : "text-forest"}>
                        {formatCurrency(Number(record.variance || 0), locale)}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gold">{formatCurrency(Number(record.scheduledOvertimeCost || 0), locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
              <i className="fas fa-coins text-2xl text-stone/60" />
            </div>
            <p className="text-ink/60 font-medium mb-1">{d.noLaborCostData}</p>
            <p className="text-ink/40 text-sm">{d.noLaborCostDataHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
