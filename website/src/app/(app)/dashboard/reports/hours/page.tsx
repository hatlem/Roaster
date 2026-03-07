import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { ReportExportButton } from "@/components/dashboard/ReportExportButton";
import { HoursBarChart } from "@/components/dashboard/ReportCharts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.hoursTitle };
}

async function getHoursData(orgId: string) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const shifts = await prisma.shift.findMany({
      where: {
        roster: { organizationId: orgId },
        startTime: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { user: { select: { firstName: true, lastName: true, department: true } } },
    });

    const totalScheduledHours = shifts.reduce((sum, s) => {
      const hours = (s.endTime.getTime() - s.startTime.getTime()) / 3600000 - (s.breakMinutes / 60);
      return sum + hours;
    }, 0);

    const overtimeHours = shifts
      .filter(s => s.isOvertime)
      .reduce((sum, s) => {
        return sum + (s.endTime.getTime() - s.startTime.getTime()) / 3600000 - (s.breakMinutes / 60);
      }, 0);

    const uniqueEmployees = new Set(shifts.map(s => s.userId)).size;

    const byEmployee = new Map<string, { name: string; department: string | null; hours: number; overtime: number; shifts: number }>();
    shifts.forEach(s => {
      const hours = (s.endTime.getTime() - s.startTime.getTime()) / 3600000 - (s.breakMinutes / 60);
      const existing = byEmployee.get(s.userId) || {
        name: `${s.user.firstName} ${s.user.lastName}`,
        department: s.user.department,
        hours: 0,
        overtime: 0,
        shifts: 0,
      };
      existing.hours += hours;
      if (s.isOvertime) existing.overtime += hours;
      existing.shifts += 1;
      byEmployee.set(s.userId, existing);
    });

    const actualHoursAgg = await prisma.actualHours.aggregate({
      where: {
        user: { organizationId: orgId },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { totalHours: true },
    });

    return {
      totalScheduledHours: Math.round(totalScheduledHours * 10) / 10,
      totalWorkedHours: Math.round((actualHoursAgg._sum.totalHours || 0) * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      uniqueEmployees,
      byEmployee: Array.from(byEmployee.entries())
        .map(([id, data]) => ({
          id,
          ...data,
          hours: Math.round(data.hours * 10) / 10,
          overtime: Math.round(data.overtime * 10) / 10,
        }))
        .sort((a, b) => b.hours - a.hours),
    };
  } catch {
    return {
      totalScheduledHours: 0,
      totalWorkedHours: 0,
      overtimeHours: 0,
      uniqueEmployees: 0,
      byEmployee: [],
    };
  }
}

export default async function HoursReportPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as { organizationId?: string })?.organizationId;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.reports;

  const data = orgId ? await getHoursData(orgId) : null;
  const { totalScheduledHours, totalWorkedHours, overtimeHours, uniqueEmployees, byEmployee } = data || {
    totalScheduledHours: 0,
    totalWorkedHours: 0,
    overtimeHours: 0,
    uniqueEmployees: 0,
    byEmployee: [],
  };

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
          <p className="text-3xl font-display">{totalScheduledHours}h</p>
          <p className="text-ink/60 text-sm">{d.totalScheduled}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-terracotta to-gold" />
          <p className="text-3xl font-display">{totalWorkedHours}h</p>
          <p className="text-ink/60 text-sm">{d.totalWorked}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-forest/40" />
          <p className="text-3xl font-display text-forest">{overtimeHours}h</p>
          <p className="text-ink/60 text-sm">{d.overtimeLabel}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-6">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold to-gold/40" />
          <p className="text-3xl font-display">{uniqueEmployees}</p>
          <p className="text-ink/60 text-sm">{d.employees}</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.hoursByEmployee}</h2>
          <ReportExportButton reportType="hours" format="csv" label={d.exportCSV} icon="fas fa-download" className="border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors" />
        </div>

        {byEmployee.length > 0 ? (
          <>
            <div className="mb-6 border border-stone/20 rounded-xl p-4 bg-cream/30">
              <HoursBarChart
                data={byEmployee.map(e => ({ name: e.name, hours: Math.round(e.hours * 10) / 10, overtime: Math.round(e.overtime * 10) / 10 }))}
                hoursLabel={d.totalScheduled}
                overtimeLabel={d.overtimeLabel}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-warm-dark/5 border-b border-stone/50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-sm">{d.employees}</th>
                    <th className="text-left p-3 font-semibold text-sm">{d.department}</th>
                    <th className="text-right p-3 font-semibold text-sm">{d.totalScheduled}</th>
                    <th className="text-right p-3 font-semibold text-sm">{d.overtimeLabel}</th>
                    <th className="text-right p-3 font-semibold text-sm">{d.scheduledShifts}</th>
                  </tr>
                </thead>
                <tbody>
                  {byEmployee.map((emp, idx) => (
                    <tr key={emp.id} className={`border-b border-stone/30 ${idx % 2 === 0 ? "bg-cream/30" : "bg-white"}`}>
                      <td className="p-3 font-medium">{emp.name}</td>
                      <td className="p-3 text-ink/60">{emp.department || "-"}</td>
                      <td className="p-3 text-right">{emp.hours}h</td>
                      <td className="p-3 text-right">
                        {emp.overtime > 0 ? (
                          <span className="text-terracotta font-medium">{emp.overtime}h</span>
                        ) : (
                          <span className="text-ink/40">0h</span>
                        )}
                      </td>
                      <td className="p-3 text-right">{emp.shifts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
}
