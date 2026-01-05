import Link from "next/link";

export const metadata = {
  title: "Audit Trail",
};

export default function AuditReportPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/reports"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          Back to Reports
        </Link>
        <h1 className="font-display text-4xl mb-2">Audit Trail</h1>
        <p className="text-ink/60">Complete log of all schedule changes for compliance verification</p>
      </div>

      {/* Info Box */}
      <div className="bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-info-circle text-ocean" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">2-Year Retention Policy</h3>
            <p className="text-ink/60 text-sm">
              All schedule changes and roster modifications are logged and retained for 2 years.
              This audit trail is available for labor inspections.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
              <span className="py-2">to</span>
              <input
                type="date"
                className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Action Type</label>
            <select className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="">All Actions</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
              <option value="publish">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">User</label>
            <select className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="">All Users</option>
            </select>
          </div>
          <button className="bg-ocean text-white px-6 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
            Filter
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0</p>
          <p className="text-ink/60 text-sm">Total Events</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0</p>
          <p className="text-ink/60 text-sm">Roster Changes</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-ocean">0</p>
          <p className="text-ink/60 text-sm">Shift Updates</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-gold">0</p>
          <p className="text-ink/60 text-sm">User Actions</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Audit Log</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            Export for Audit
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/50">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">Timestamp</th>
                <th className="text-left p-3 font-semibold text-sm">User</th>
                <th className="text-left p-3 font-semibold text-sm">Action</th>
                <th className="text-left p-3 font-semibold text-sm">Resource</th>
                <th className="text-left p-3 font-semibold text-sm">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="text-center py-12 text-ink/60">
                  <i className="fas fa-history text-4xl mb-4 text-stone block" />
                  <p>No audit events recorded yet</p>
                  <p className="text-sm">All schedule changes will be automatically logged here</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
