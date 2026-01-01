import Link from "next/link";
import { complianceStats } from "@/content";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Dashboard</h1>
        <p className="text-ink/60">Welcome back! Here&apos;s your compliance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-shield-alt text-forest text-xl" />
            </div>
            <span className="text-xs font-medium text-forest bg-forest/10 px-2 py-1 rounded-full">
              Good
            </span>
          </div>
          <p className="font-display text-3xl mb-1">{complianceStats.complianceRate}</p>
          <p className="text-ink/60 text-sm">Compliance Rate</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-check text-ocean text-xl" />
            </div>
          </div>
          <p className="font-display text-3xl mb-1">3</p>
          <p className="text-ink/60 text-sm">Active Rosters</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-terracotta/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-users text-terracotta text-xl" />
            </div>
          </div>
          <p className="font-display text-3xl mb-1">48</p>
          <p className="text-ink/60 text-sm">Active Employees</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-clock text-gold text-xl" />
            </div>
          </div>
          <p className="font-display text-3xl mb-1">156</p>
          <p className="text-ink/60 text-sm">Shifts This Week</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/rosters/new"
              className="flex items-center gap-3 p-4 rounded-xl bg-cream hover:bg-stone/30 transition-colors"
            >
              <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-plus text-ocean" />
              </div>
              <div>
                <p className="font-semibold">Create New Roster</p>
                <p className="text-ink/60 text-sm">Start scheduling for a new period</p>
              </div>
            </Link>
            <Link
              href="/dashboard/employees/new"
              className="flex items-center gap-3 p-4 rounded-xl bg-cream hover:bg-stone/30 transition-colors"
            >
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-plus text-forest" />
              </div>
              <div>
                <p className="font-semibold">Add Employee</p>
                <p className="text-ink/60 text-sm">Onboard a new team member</p>
              </div>
            </Link>
            <Link
              href="/dashboard/reports/compliance"
              className="flex items-center gap-3 p-4 rounded-xl bg-cream hover:bg-stone/30 transition-colors"
            >
              <div className="w-10 h-10 bg-terracotta/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-terracotta" />
              </div>
              <div>
                <p className="font-semibold">Generate Report</p>
                <p className="text-ink/60 text-sm">Create compliance documentation</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-4">Compliance Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-forest/5 border border-forest/20">
              <div className="w-8 h-8 bg-forest/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check text-forest text-sm" />
              </div>
              <div>
                <p className="font-semibold text-sm">All Rest Periods Valid</p>
                <p className="text-ink/60 text-xs">No violations detected in current rosters</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/20">
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-exclamation text-gold text-sm" />
              </div>
              <div>
                <p className="font-semibold text-sm">14-Day Rule Reminder</p>
                <p className="text-ink/60 text-xs">February roster due in 5 days</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-ocean/5 border border-ocean/20">
              <div className="w-8 h-8 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-info text-ocean text-sm" />
              </div>
              <div>
                <p className="font-semibold text-sm">Overtime Tracking</p>
                <p className="text-ink/60 text-xs">2 employees approaching weekly limit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <h2 className="font-display text-xl mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 py-3 border-b border-stone/30">
            <div className="w-10 h-10 bg-ocean/10 rounded-full flex items-center justify-center">
              <i className="fas fa-calendar text-ocean text-sm" />
            </div>
            <div className="flex-1">
              <p className="font-medium">January Roster Published</p>
              <p className="text-ink/60 text-sm">Published 2 days ago by Manager</p>
            </div>
            <span className="text-xs text-forest bg-forest/10 px-2 py-1 rounded-full">Compliant</span>
          </div>
          <div className="flex items-center gap-4 py-3 border-b border-stone/30">
            <div className="w-10 h-10 bg-forest/10 rounded-full flex items-center justify-center">
              <i className="fas fa-user-plus text-forest text-sm" />
            </div>
            <div className="flex-1">
              <p className="font-medium">New Employee Added</p>
              <p className="text-ink/60 text-sm">Employee onboarded 3 days ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 py-3">
            <div className="w-10 h-10 bg-terracotta/10 rounded-full flex items-center justify-center">
              <i className="fas fa-exchange-alt text-terracotta text-sm" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Shift Swap Approved</p>
              <p className="text-ink/60 text-sm">Approved 5 days ago</p>
            </div>
            <span className="text-xs text-forest bg-forest/10 px-2 py-1 rounded-full">Validated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
