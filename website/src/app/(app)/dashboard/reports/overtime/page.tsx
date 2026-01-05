import Link from "next/link";

export const metadata = {
  title: "Overtime Analysis",
};

export default function OvertimeReportPage() {
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
        <h1 className="font-display text-4xl mb-2">Overtime Analysis</h1>
        <p className="text-ink/60">Track overtime hours against legal limits</p>
      </div>

      {/* Overtime Limits Info */}
      <div className="bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6">
        <h3 className="font-semibold mb-3">Overtime Limits</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-week text-ocean" />
            </div>
            <div>
              <p className="font-medium">10 hours/week</p>
              <p className="text-ink/60">Weekly limit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-alt text-ocean" />
            </div>
            <div>
              <p className="font-medium">25 hours/month</p>
              <p className="text-ink/60">Monthly limit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar text-ocean" />
            </div>
            <div>
              <p className="font-medium">200 hours/year</p>
              <p className="text-ink/60">Annual limit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">This Week</p>
          <div className="mt-2 h-2 bg-stone/20 rounded-full overflow-hidden">
            <div className="h-full bg-forest" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-ink/40 mt-1">0% of 10h limit</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">This Month</p>
          <div className="mt-2 h-2 bg-stone/20 rounded-full overflow-hidden">
            <div className="h-full bg-forest" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-ink/40 mt-1">0% of 25h limit</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">This Year</p>
          <div className="mt-2 h-2 bg-stone/20 rounded-full overflow-hidden">
            <div className="h-full bg-forest" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-ink/40 mt-1">0% of 200h limit</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0</p>
          <p className="text-ink/60 text-sm">Employees at Risk</p>
          <p className="text-xs text-ink/40 mt-2">Approaching limits</p>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Overtime by Employee</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            Export Report
          </button>
        </div>

        <div className="text-center py-12 text-ink/60">
          <i className="fas fa-hourglass-half text-4xl mb-4 text-stone" />
          <p>No overtime data available</p>
          <p className="text-sm">Overtime tracking will appear once shifts are logged</p>
        </div>
      </div>
    </div>
  );
}
