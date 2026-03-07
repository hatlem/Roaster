import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getEmployee(id: string) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id },
      include: {
        location: true,
      },
    });
    return employee;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const employee = await getEmployee(id);
  return {
    title: employee ? `${employee.firstName} ${employee.lastName}` : dict.dashboard.employees.employeeNotFound,
  };
}

function getRoleColor(role: string) {
  switch (role) {
    case "ADMIN": return { ring: "ring-terracotta/40", bg: "bg-terracotta/10", text: "text-terracotta", badge: "bg-terracotta/10 text-terracotta" };
    case "MANAGER": return { ring: "ring-ocean/40", bg: "bg-ocean/10", text: "text-ocean", badge: "bg-ocean/10 text-ocean" };
    case "REPRESENTATIVE": return { ring: "ring-gold/40", bg: "bg-gold/10", text: "text-gold", badge: "bg-gold/10 text-gold" };
    default: return { ring: "ring-stone/40", bg: "bg-stone/30", text: "text-ink/50", badge: "bg-stone/30 text-ink/60" };
  }
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.employees;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  const roleColors = getRoleColor(employee.role);
  const maxWeeklyHours = 40;
  const weeklyHours = 0;
  const monthlyHours = 0;
  const overtimeHours = 0;
  const weeklyPercent = Math.min(100, Math.round((weeklyHours / maxWeeklyHours) * 100));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="relative overflow-hidden mb-8">
        <div className="warm-orb w-[400px] h-[400px] bg-terracotta -top-40 -right-40" />

        <div className="relative z-10 animate-fade-up">
          <Link
            href="/dashboard/employees"
            className="text-ocean hover:text-ocean/70 font-medium inline-flex items-center gap-2 mb-6 transition-colors"
          >
            <i className="fas fa-arrow-left text-sm" />
            {d.backToEmployees}
          </Link>

          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 ${roleColors.bg} rounded-full flex items-center justify-center ring-4 ${roleColors.ring} ring-offset-2 ring-offset-white`}>
              <span className={`${roleColors.text} font-semibold text-2xl`}>
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl mb-1">{employee.firstName} {employee.lastName}</h1>
              <div className="flex items-center gap-3">
                <p className="text-ink/60">{employee.position || employee.role}</p>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${roleColors.badge}`}>
                  {employee.role}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  employee.isActive ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"
                }`}>
                  {employee.isActive ? d.active : d.inactive}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="accent-line mt-6 animate-line-reveal delay-2" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden card-hover animate-fade-up delay-1">
            <div className="h-1 bg-gradient-to-r from-ocean via-forest to-transparent" />
            <div className="p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <i className="fas fa-user text-ocean/40 text-sm" />
                {d.personalInformation}
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="group">
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.email}</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div className="group">
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.phone}</p>
                  <p className="font-medium">{employee.phoneNumber || "-"}</p>
                </div>
                <div className="group">
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.employeeNumber}</p>
                  <p className="font-medium font-mono">{employee.employeeNumber || "-"}</p>
                </div>
                <div className="group">
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.hireDate}</p>
                  <p className="font-medium">
                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString(locale) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden card-hover animate-fade-up delay-2">
            <div className="h-1 bg-gradient-to-r from-terracotta via-gold to-transparent" />
            <div className="p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <i className="fas fa-briefcase text-terracotta/40 text-sm" />
                {d.employmentDetails}
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.role}</p>
                  <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${roleColors.badge}`}>
                    {employee.role}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.department}</p>
                  <p className="font-medium">{employee.department || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.position}</p>
                  <p className="font-medium">{employee.position || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.location}</p>
                  <p className="font-medium">{employee.location?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.hourlyRate}</p>
                  <p className="font-medium">
                    {employee.hourlyRate ? `${employee.hourlyRate} kr/h` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5">{d.status}</p>
                  <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                    employee.isActive ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"
                  }`}>
                    {employee.isActive ? d.active : d.inactive}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Shifts */}
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden card-hover animate-fade-up delay-3">
            <div className="h-1 bg-gradient-to-r from-forest via-ocean to-transparent" />
            <div className="p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <i className="fas fa-calendar-alt text-forest/40 text-sm" />
                {d.upcomingShifts}
              </h2>
              <div className="py-8">
                <div className="flex flex-col items-center">
                  {/* Timeline placeholder */}
                  <div className="w-full max-w-xs space-y-3 mb-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full border-2 border-dashed border-stone/40" />
                        <div className={`flex-1 h-3 rounded-full border border-dashed border-stone/30 ${i === 2 ? "w-3/4" : i === 3 ? "w-1/2" : "w-full"}`} />
                      </div>
                    ))}
                  </div>
                  <p className="text-ink/50 text-sm">{d.noUpcomingShifts}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden card-hover animate-fade-up delay-3">
            <div className="h-1 bg-gradient-to-r from-gold via-terracotta to-transparent" />
            <div className="p-6">
              <h2 className="font-display text-xl mb-5 flex items-center gap-2">
                <i className="fas fa-chart-bar text-gold/40 text-sm" />
                {d.quickStats}
              </h2>

              {/* Weekly hours gauge */}
              <div className="mb-6 text-center">
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-stone/30" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="currentColor"
                      className="text-ocean"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${weeklyPercent * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">{weeklyHours}h</span>
                    <span className="text-[10px] text-ink/40 uppercase">/ {maxWeeklyHours}h</span>
                  </div>
                </div>
                <p className="text-xs text-ink/40 uppercase tracking-wide font-medium">{d.hoursThisWeek}</p>
              </div>

              <div className="space-y-4">
                {/* Hours this week with progress bar */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-ink/60">{d.hoursThisWeek}</span>
                    <span className="text-sm font-semibold">{weeklyHours}h / {maxWeeklyHours}h</span>
                  </div>
                  <div className="h-2 bg-stone/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ocean to-ocean/70 rounded-full transition-all duration-500"
                      style={{ width: `${weeklyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Hours this month */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-ink/60">{d.hoursThisMonth}</span>
                    <span className="text-sm font-semibold">{monthlyHours}h</span>
                  </div>
                  <div className="h-2 bg-stone/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-forest to-forest/70 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((monthlyHours / (maxWeeklyHours * 4.33)) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Overtime */}
                <div className="pt-2 border-t border-stone/30">
                  <div className="flex justify-between">
                    <span className="text-sm text-ink/60">{d.overtimeYTD}</span>
                    <span className={`text-sm font-bold ${overtimeHours > 0 ? "text-gold" : "text-forest"}`}>
                      {overtimeHours}h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden card-hover animate-fade-up delay-4">
            <div className="h-1 bg-gradient-to-r from-ocean via-gold to-transparent" />
            <div className="p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <i className="fas fa-bolt text-ocean/40 text-sm" />
                {d.actionsTitle}
              </h2>
              <div className="space-y-1.5">
                <Link
                  href={`/dashboard/employees/${employee.id}/edit`}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-ocean/10 text-ink/80 flex items-center gap-3 transition-colors duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-ocean/10 flex items-center justify-center group-hover:bg-ocean/20 transition-colors">
                    <i className="fas fa-edit text-ocean text-sm" />
                  </div>
                  <span className="font-medium text-sm">{d.editEmployee}</span>
                </Link>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-forest/10 text-ink/80 flex items-center gap-3 transition-colors duration-200 group">
                  <div className="w-8 h-8 rounded-lg bg-forest/10 flex items-center justify-center group-hover:bg-forest/20 transition-colors">
                    <i className="fas fa-calendar-plus text-forest text-sm" />
                  </div>
                  <span className="font-medium text-sm">{d.assignShift}</span>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gold/10 text-ink/80 flex items-center gap-3 transition-colors duration-200 group">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <i className="fas fa-file-alt text-gold text-sm" />
                  </div>
                  <span className="font-medium text-sm">{d.viewReports}</span>
                </button>
                <div className="pt-2 mt-2 border-t border-stone/20">
                  <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-terracotta/10 text-terracotta/80 flex items-center gap-3 transition-colors duration-200 group">
                    <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20 transition-colors">
                      <i className="fas fa-user-times text-terracotta text-sm" />
                    </div>
                    <span className="font-medium text-sm">{d.deactivate}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
