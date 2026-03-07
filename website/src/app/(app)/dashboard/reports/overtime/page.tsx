import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { ReportExportButton } from "@/components/dashboard/ReportExportButton";
import { OvertimeProgressChart } from "@/components/dashboard/ReportCharts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.overtimeReportTitle };
}

async function getOvertimeData(orgId: string) {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const overtimeShifts = await prisma.shift.findMany({
      where: {
        roster: { organizationId: orgId },
        isOvertime: true,
        startTime: { gte: startOfYear },
      },
      include: { user: { select: { firstName: true, lastName: true, department: true } } },
    });

    const calcHours = (shifts: typeof overtimeShifts) =>
      shifts.reduce((sum, s) => sum + (s.endTime.getTime() - s.startTime.getTime()) / 3600000 - s.breakMinutes / 60, 0);

    const weeklyShifts = overtimeShifts.filter(s => s.startTime >= startOfWeek);
    const monthlyShifts = overtimeShifts.filter(s => s.startTime >= startOfMonth);

    const weeklyHours = Math.round(calcHours(weeklyShifts) * 10) / 10;
    const monthlyHours = Math.round(calcHours(monthlyShifts) * 10) / 10;
    const yearlyHours = Math.round(calcHours(overtimeShifts) * 10) / 10;

    // Group by employee
    const byEmployee = new Map<string, { name: string; dept: string | null; weekly: number; monthly: number; yearly: number }>();
    overtimeShifts.forEach(s => {
      const hours = (s.endTime.getTime() - s.startTime.getTime()) / 3600000 - s.breakMinutes / 60;
      const existing = byEmployee.get(s.userId) || {
        name: `${s.user.firstName} ${s.user.lastName}`,
        dept: s.user.department,
        weekly: 0,
        monthly: 0,
        yearly: 0,
      };
      existing.yearly += hours;
      if (s.startTime >= startOfMonth) existing.monthly += hours;
      if (s.startTime >= startOfWeek) existing.weekly += hours;
      byEmployee.set(s.userId, existing);
    });

    const employeesAtRisk = Array.from(byEmployee.values()).filter(e => e.weekly > 8).length;

    return {
      weeklyHours,
      monthlyHours,
      yearlyHours,
      employeesAtRisk,
      byEmployee: Array.from(byEmployee.entries())
        .map(([id, data]) => ({
          id,
          ...data,
          weekly: Math.round(data.weekly * 10) / 10,
          monthly: Math.round(data.monthly * 10) / 10,
          yearly: Math.round(data.yearly * 10) / 10,
        }))
        .sort((a, b) => b.yearly - a.yearly),
    };
  } catch {
    return {
      weeklyHours: 0,
      monthlyHours: 0,
      yearlyHours: 0,
      employeesAtRisk: 0,
      byEmployee: [],
    };
  }
}

export default async function OvertimeReportPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as { organizationId?: string })?.organizationId;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.reports;

  const data = orgId ? await getOvertimeData(orgId) : null;
  const { weeklyHours, monthlyHours, yearlyHours, employeesAtRisk, byEmployee } = data || {
    weeklyHours: 0,
    monthlyHours: 0,
    yearlyHours: 0,
    employeesAtRisk: 0,
    byEmployee: [],
  };

  // Calculate progress percentages for limits (10h/week, 25h/month, 200h/year)
  const weeklyPct = Math.min(Math.round((weeklyHours / 10) * 100), 100);
  const monthlyPct = Math.min(Math.round((monthlyHours / 25) * 100), 100);
  const yearlyPct = Math.min(Math.round((yearlyHours / 200) * 100), 100);

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--terracotta), transparent)", opacity: 0.06 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/reports"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4 animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToReports}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-1">{d.overtimeReportTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-2">{d.overtimeReportSubtitle}</p>
        </div>
      </div>

      {/* Overtime Limits Info */}
      <div className="bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6 animate-fade-up delay-2">
        <h3 className="font-semibold mb-3">{d.overtimeLimits}</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-week text-ocean" />
            </div>
            <div>
              <p className="font-medium">{d.hoursPerWeek}</p>
              <p className="text-ink/60">{d.weeklyLimit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-alt text-ocean" />
            </div>
            <div>
              <p className="font-medium">{d.hoursPerMonth}</p>
              <p className="text-ink/60">{d.monthlyLimit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar text-ocean" />
            </div>
            <div>
              <p className="font-medium">{d.hoursPerYear}</p>
              <p className="text-ink/60">{d.annualLimit}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-gold" />
          <p className={`text-3xl font-display ${weeklyPct >= 80 ? "text-terracotta" : "text-forest"}`}>{weeklyHours}h</p>
          <p className="text-ink/60 text-sm">{d.thisWeekOvertime}</p>
          <div className="mt-2 h-2 bg-stone/15 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${weeklyPct >= 80 ? "bg-gradient-to-r from-terracotta to-gold" : "bg-gradient-to-r from-forest to-gold"}`}
              style={{ width: `${weeklyPct}%` }}
            />
          </div>
          <p className="text-xs text-ink/40 mt-1">{weeklyPct}% of 10h limit</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-gold" />
          <p className={`text-3xl font-display ${monthlyPct >= 80 ? "text-terracotta" : "text-forest"}`}>{monthlyHours}h</p>
          <p className="text-ink/60 text-sm">{d.thisMonthOvertime}</p>
          <div className="mt-2 h-2 bg-stone/15 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${monthlyPct >= 80 ? "bg-gradient-to-r from-terracotta to-gold" : "bg-gradient-to-r from-forest to-gold"}`}
              style={{ width: `${monthlyPct}%` }}
            />
          </div>
          <p className="text-xs text-ink/40 mt-1">{monthlyPct}% of 25h limit</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-gold" />
          <p className={`text-3xl font-display ${yearlyPct >= 80 ? "text-terracotta" : "text-forest"}`}>{yearlyHours}h</p>
          <p className="text-ink/60 text-sm">{d.thisYearOvertime}</p>
          <div className="mt-2 h-2 bg-stone/15 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${yearlyPct >= 80 ? "bg-gradient-to-r from-terracotta to-gold" : "bg-gradient-to-r from-forest to-gold"}`}
              style={{ width: `${yearlyPct}%` }}
            />
          </div>
          <p className="text-xs text-ink/40 mt-1">{yearlyPct}% of 200h limit</p>
        </div>
        <div className={`relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-6 ${employeesAtRisk > 0 ? "animate-pulse" : ""}`}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-terracotta to-gold" />
          <p className={`text-3xl font-display ${employeesAtRisk > 0 ? "text-terracotta" : "text-forest"}`}>{employeesAtRisk}</p>
          <p className="text-ink/60 text-sm">{d.employeesAtRisk}</p>
          <p className="text-xs text-ink/40 mt-2">{d.approachingLimits}</p>
        </div>
      </div>

      {/* Overtime Gauges */}
      {(weeklyHours > 0 || monthlyHours > 0 || yearlyHours > 0) && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6 animate-fade-up delay-6">
          <h2 className="font-display text-xl mb-4">{d.overtimeReportTitle}</h2>
          <OvertimeProgressChart
            weeklyHours={weeklyHours}
            monthlyHours={monthlyHours}
            yearlyHours={yearlyHours}
            weeklyLimit={10}
            monthlyLimit={25}
            yearlyLimit={200}
            weeklyLabel={d.thisWeekOvertime}
            monthlyLabel={d.thisMonthOvertime}
            yearlyLabel={d.thisYearOvertime}
          />
        </div>
      )}

      {/* Employee Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.overtimeByEmployee}</h2>
          <ReportExportButton reportType="overtime" format="csv" label={d.exportReport} icon="fas fa-download" className="border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors" />
        </div>

        {byEmployee.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warm-dark/5 border-b border-stone/50">
                <tr>
                  <th className="text-left p-3 font-semibold text-sm">{d.employees}</th>
                  <th className="text-left p-3 font-semibold text-sm">{d.department}</th>
                  <th className="text-right p-3 font-semibold text-sm">{d.thisWeekOvertime}</th>
                  <th className="text-right p-3 font-semibold text-sm">{d.thisMonthOvertime}</th>
                  <th className="text-right p-3 font-semibold text-sm">{d.thisYearOvertime}</th>
                </tr>
              </thead>
              <tbody>
                {byEmployee.map((emp, idx) => (
                  <tr key={emp.id} className={`border-b border-stone/30 ${idx % 2 === 0 ? "bg-cream/30" : "bg-white"}`}>
                    <td className="p-3 font-medium">{emp.name}</td>
                    <td className="p-3 text-ink/60">{emp.dept || "-"}</td>
                    <td className="p-3 text-right">
                      <span className={emp.weekly > 8 ? "text-terracotta font-medium" : ""}>{emp.weekly}h</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={emp.monthly > 20 ? "text-terracotta font-medium" : ""}>{emp.monthly}h</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={emp.yearly > 160 ? "text-terracotta font-medium" : ""}>{emp.yearly}h</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
              <i className="fas fa-hourglass-half text-2xl text-stone/60" />
            </div>
            <p className="text-ink/60 font-medium mb-1">{d.noOvertimeData}</p>
            <p className="text-ink/40 text-sm">{d.noOvertimeDataHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
