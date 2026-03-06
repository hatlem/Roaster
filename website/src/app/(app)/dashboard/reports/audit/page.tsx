import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.auditTitle };
}

export default async function AuditReportPage() {
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
        <h1 className="font-display text-4xl mb-2">{d.auditTitle}</h1>
        <p className="text-ink/60">{d.auditSubtitle}</p>
      </div>

      {/* Info Box */}
      <div className="bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-info-circle text-ocean" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">{d.retentionPolicyTitle}</h3>
            <p className="text-ink/60 text-sm">
              {d.retentionPolicyDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{d.dateRange}</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
              <span className="py-2">{d.to}</span>
              <input
                type="date"
                className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.actionType}</label>
            <select className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="">{d.allActions}</option>
              <option value="create">{d.created}</option>
              <option value="update">{d.updated}</option>
              <option value="delete">{d.deleted}</option>
              <option value="publish">{d.publishedAction}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.user}</label>
            <select className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="">{d.allUsers}</option>
            </select>
          </div>
          <button className="bg-ocean text-white px-6 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
            {d.filter}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0</p>
          <p className="text-ink/60 text-sm">{d.totalEvents}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0</p>
          <p className="text-ink/60 text-sm">{d.rosterChanges}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-ocean">0</p>
          <p className="text-ink/60 text-sm">{d.shiftUpdates}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-gold">0</p>
          <p className="text-ink/60 text-sm">{d.userActions}</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.auditLog}</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            {d.exportForAudit}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/50">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">{d.timestamp}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.user}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.action}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.resource}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.details}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="text-center py-12 text-ink/60">
                  <i className="fas fa-history text-4xl mb-4 text-stone block" />
                  <p>{d.noAuditEvents}</p>
                  <p className="text-sm">{d.noAuditEventsHint}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
