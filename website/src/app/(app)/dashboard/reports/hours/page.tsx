import Link from "next/link";

export const metadata = {
  title: "Working Hours Report",
};

export default function HoursReportPage() {
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
        <h1 className="font-display text-4xl mb-2">Working Hours Report</h1>
        <p className="text-ink/60">Summary of scheduled and actual working hours per employee</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Department</label>
            <select className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="">All Departments</option>
              <option value="sales">Sales</option>
              <option value="operations">Operations</option>
              <option value="support">Support</option>
            </select>
          </div>
          <button className="bg-ocean text-white px-6 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0h</p>
          <p className="text-ink/60 text-sm">Total Scheduled</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0h</p>
          <p className="text-ink/60 text-sm">Total Worked</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-forest">0h</p>
          <p className="text-ink/60 text-sm">Overtime</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0</p>
          <p className="text-ink/60 text-sm">Employees</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Hours by Employee</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            Export CSV
          </button>
        </div>

        <div className="text-center py-12 text-ink/60">
          <i className="fas fa-clock text-4xl mb-4 text-stone" />
          <p>No working hours data available</p>
          <p className="text-sm">Select a date range and generate the report to see data</p>
        </div>
      </div>
    </div>
  );
}
