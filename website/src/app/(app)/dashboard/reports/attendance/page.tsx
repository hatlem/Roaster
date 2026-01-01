import Link from "next/link";

export const metadata = {
  title: "Attendance Report",
};

export default function AttendanceReportPage() {
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
        <h1 className="font-display text-4xl mb-2">Attendance Report</h1>
        <p className="text-ink/60">Track employee attendance, absences, and time-off usage</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Period</label>
            <select className="px-4 py-2 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
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
          <p className="text-3xl font-display text-forest">100%</p>
          <p className="text-ink/60 text-sm">Attendance Rate</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">0</p>
          <p className="text-ink/60 text-sm">Scheduled Shifts</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-gold">0</p>
          <p className="text-ink/60 text-sm">Absences</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display text-ocean">0</p>
          <p className="text-ink/60 text-sm">Time-Off Days</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-4">Absence Reasons</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-terracotta" />
                <span className="text-sm">Sick Leave</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-ocean" />
                <span className="text-sm">Vacation</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold" />
                <span className="text-sm">Personal Leave</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-forest" />
                <span className="text-sm">Parental Leave</span>
              </div>
              <span className="text-sm font-medium">0</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-4">Attendance Trend</h2>
          <div className="text-center py-8 text-ink/60">
            <i className="fas fa-chart-line text-4xl mb-4 text-stone" />
            <p>No trend data available</p>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Attendance by Employee</h2>
          <button className="flex items-center gap-2 border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors">
            <i className="fas fa-download" />
            Export Report
          </button>
        </div>

        <div className="text-center py-12 text-ink/60">
          <i className="fas fa-user-check text-4xl mb-4 text-stone" />
          <p>No attendance data available</p>
          <p className="text-sm">Attendance tracking will appear once shifts are logged</p>
        </div>
      </div>
    </div>
  );
}
