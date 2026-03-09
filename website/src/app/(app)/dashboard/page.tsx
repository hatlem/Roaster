import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  Users,
  FileText,
  Clock,
  TrendingUp,
  Activity,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.home.title };
}

function getGreeting(d: ReturnType<typeof getDictionary>["dashboard"]["home"]) {
  const hour = new Date().getHours();
  if (hour < 12) return d.goodMorning;
  if (hour < 18) return d.goodAfternoon;
  return d.goodEvening;
}

async function getDashboardData() {
  try {
    // Calculate start and end of current week (Monday-based)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [
      employeeCount,
      rosterCount,
      publishedRosterCount,
      totalShiftsThisWeek,
      violatingShiftsThisWeek,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.roster.count(),
      prisma.roster.count({
        where: { status: { in: ["PUBLISHED", "ACTIVE"] } },
      }),
      prisma.shift.count({
        where: {
          startTime: { gte: startOfWeek },
          endTime: { lte: endOfWeek },
        },
      }),
      prisma.shift.count({
        where: {
          startTime: { gte: startOfWeek },
          endTime: { lte: endOfWeek },
          OR: [
            { violatesRestPeriod: true },
            { violatesDailyLimit: true },
            { violatesWeeklyLimit: true },
          ],
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 5,
        select: {
          id: true,
          action: true,
          entityType: true,
          timestamp: true,
          userEmail: true,
        },
      }),
    ]);

    const complianceRate =
      totalShiftsThisWeek > 0
        ? Math.round(
            ((totalShiftsThisWeek - violatingShiftsThisWeek) /
              totalShiftsThisWeek) *
              100
          )
        : 100;

    return {
      hasEmployees: employeeCount > 0,
      hasRosters: rosterCount > 0,
      hasPublished: publishedRosterCount > 0,
      employeeCount,
      rosterCount,
      publishedRosterCount,
      totalShiftsThisWeek,
      complianceRate,
      recentAuditLogs,
    };
  } catch {
    return {
      hasEmployees: false,
      hasRosters: false,
      hasPublished: false,
      employeeCount: 0,
      rosterCount: 0,
      publishedRosterCount: 0,
      totalShiftsThisWeek: 0,
      complianceRate: 100,
      recentAuditLogs: [] as {
        id: string;
        action: string;
        entityType: string;
        timestamp: Date;
        userEmail: string | null;
      }[],
    };
  }
}

function formatDate(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function timeAgo(date: Date, d: ReturnType<typeof getDictionary>["dashboard"]["home"]): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return d.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return d.minutesAgo.replace('{minutes}', String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return d.hoursAgo.replace('{hours}', String(hours));
  const days = Math.floor(hours / 24);
  return d.daysAgo.replace('{days}', String(days));
}

const auditActionIcons: Record<string, { icon: string; color: string }> = {
  ROSTER_PUBLISHED: { icon: "calendar", color: "ocean" },
  ROSTER_CREATED: { icon: "calendar", color: "gold" },
  SHIFT_CHANGED: { icon: "clock", color: "terracotta" },
  USER_CREATED: { icon: "users", color: "forest" },
  COMPLIANCE_CHECK: { icon: "shield", color: "forest" },
};

export default async function DashboardPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.home;
  const data = await getDashboardData();
  const {
    hasEmployees,
    hasRosters,
    hasPublished,
    employeeCount,
    publishedRosterCount,
    totalShiftsThisWeek,
    complianceRate,
    recentAuditLogs,
  } = data;

  // Setup steps for new users
  const setupSteps = [
    {
      id: "add-employees",
      title: d.addEmployeesTitle,
      description: d.addEmployeesDescription,
      href: "/dashboard/employees/new",
      icon: Users,
    },
    {
      id: "create-roster",
      title: d.createRosterTitle,
      description: d.createRosterDescription,
      href: "/dashboard/rosters/new",
      icon: Calendar,
    },
    {
      id: "check-compliance",
      title: d.checkComplianceTitle,
      description: d.checkComplianceDescription,
      href: "/dashboard/compliance",
      icon: FileText,
    },
    {
      id: "publish-roster",
      title: d.publishRosterTitle,
      description: d.publishRosterDescription,
      href: "/dashboard/rosters",
      icon: Clock,
    },
  ];

  // Calculate completion status
  const stepsWithCompletion = setupSteps.map((step, index) => ({
    ...step,
    completed:
      index === 0
        ? hasEmployees
        : index === 1
          ? hasRosters
          : index === 2
            ? hasRosters
            : hasPublished,
  }));

  const completedSteps = stepsWithCompletion.filter((s) => s.completed).length;
  const totalSteps = stepsWithCompletion.length;
  const isSetupComplete = completedSteps === totalSteps;
  const nextStep = stepsWithCompletion.find((s) => !s.completed);

  const greeting = getGreeting(d);
  const dateString = formatDate(locale);

  // KPI stat cards configuration
  const kpiCards = [
    {
      label: d.activeEmployees,
      value: employeeCount,
      sub: d.teamMembers,
      cssColor: "var(--ocean)",
      iconBg: "bg-ocean/10",
      iconColor: "text-ocean",
      activityColor: "text-ocean/30",
      icon: Users,
      level: Math.min(employeeCount * 10, 100),
      delay: "delay-2",
    },
    {
      label: d.shiftsThisWeek,
      value: totalShiftsThisWeek,
      sub: d.scheduled,
      cssColor: "var(--gold)",
      iconBg: "bg-gold/10",
      iconColor: "text-gold",
      activityColor: "text-gold/30",
      icon: BarChart3,
      level: Math.min(totalShiftsThisWeek * 5, 100),
      delay: "delay-3",
    },
    {
      label: d.complianceRate,
      value: `${complianceRate}%`,
      sub: complianceRate === 100 ? d.allCompliant : d.hasViolations,
      cssColor: "var(--forest)",
      iconBg: "bg-forest/10",
      iconColor: "text-forest",
      activityColor: "text-forest/30",
      icon: ShieldCheck,
      level: complianceRate,
      delay: "delay-4",
    },
    {
      label: d.publishedRosters,
      value: publishedRosterCount,
      sub: d.rostersLive,
      cssColor: "var(--terracotta)",
      iconBg: "bg-terracotta/10",
      iconColor: "text-terracotta",
      activityColor: "text-terracotta/30",
      icon: TrendingUp,
      level: Math.min(publishedRosterCount * 20, 100),
      delay: "delay-5",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* ===== COMPLETED SETUP: Command Center ===== */}
      {isSetupComplete && (
        <>
          {/* Warm Header with Greeting */}
          <div className="relative mb-10 overflow-hidden rounded-2xl bg-cream/50 p-8 md:p-10 animate-fade-up">
            <div
              className="warm-orb w-[400px] h-[400px] -top-32 -right-32"
              style={{
                background:
                  "radial-gradient(circle, var(--terracotta), transparent)",
              }}
            />
            <div
              className="warm-orb w-[300px] h-[300px] -bottom-20 -left-20"
              style={{
                background:
                  "radial-gradient(circle, var(--gold), transparent)",
                animationDelay: "-5s",
              }}
            />
            <div className="relative">
              <p className="text-terracotta mb-2 tracking-widest uppercase text-xs font-semibold">
                {dateString}
              </p>
              <h1 className="font-display text-4xl md:text-5xl mb-3">
                {greeting}
              </h1>
              <p className="text-ink/50 text-lg">{d.welcomeBack}</p>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={`card-hover relative bg-white rounded-2xl p-5 border border-stone/40 overflow-hidden animate-fade-up ${card.delay}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}
                    >
                      <Icon className={`w-[18px] h-[18px] ${card.iconColor}`} />
                    </div>
                    <Activity
                      className={`w-4 h-4 ${card.activityColor}`}
                    />
                  </div>
                  <p className="font-display text-3xl mb-1">{card.value}</p>
                  <p className="text-xs text-ink/50 font-medium uppercase tracking-wide mb-3">
                    {card.label}
                  </p>
                  {/* Sparkline-style gradient bar */}
                  <div className="h-1.5 bg-stone/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${card.level}%`,
                        background: `linear-gradient(90deg, ${card.cssColor}, ${card.cssColor}80)`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-ink/40 mt-1.5">{card.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-10 animate-fade-up delay-6">
            <div className="accent-line mb-6" />
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/rosters/new"
                className="group relative card-hover flex items-center gap-4 p-6 bg-white rounded-2xl border border-stone/40 grain overflow-hidden"
              >
                <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-ocean" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold group-hover:text-ocean transition-colors duration-300">
                    {d.createNewRoster}
                  </p>
                  <p className="text-sm text-ink/50">{d.scheduleNewPeriod}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-ink/20 group-hover:text-ocean group-hover:translate-x-1 transition-all duration-300" />
              </Link>
              <Link
                href="/dashboard/employees/new"
                className="group card-hover flex items-center gap-4 p-6 bg-white rounded-2xl border border-stone/40"
              >
                <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-forest" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold group-hover:text-forest transition-colors duration-300">
                    {d.addEmployee}
                  </p>
                  <p className="text-sm text-ink/50">{d.onboardNewMember}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-ink/20 group-hover:text-forest group-hover:translate-x-1 transition-all duration-300" />
              </Link>
              <Link
                href="/dashboard/reports/compliance"
                className="group card-hover flex items-center gap-4 p-6 bg-white rounded-2xl border border-stone/40"
              >
                <div className="w-12 h-12 bg-terracotta/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-terracotta" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold group-hover:text-terracotta transition-colors duration-300">
                    {d.complianceReport}
                  </p>
                  <p className="text-sm text-ink/50">
                    {d.generateDocumentation}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-ink/20 group-hover:text-terracotta group-hover:translate-x-1 transition-all duration-300" />
              </Link>
              <Link
                href="/dashboard/marketplace"
                className="group card-hover flex items-center gap-4 p-6 bg-white rounded-2xl border border-stone/40"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold group-hover:text-gold transition-colors duration-300">
                    {d.shiftMarketplace}
                  </p>
                  <p className="text-sm text-ink/50">{d.manageShiftSwaps}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-ink/20 group-hover:text-gold group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="animate-fade-up delay-7">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-2xl">{d.recentActivity}</h2>
                <p className="text-sm text-ink/50">
                  {d.recentActivityDescription}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone/40 overflow-hidden">
              {recentAuditLogs.length > 0 ? (
                <div className="divide-y divide-stone/20">
                  {recentAuditLogs.map((log, index) => {
                    const meta = auditActionIcons[log.action] || {
                      icon: "activity",
                      color: "stone",
                    };
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-4 hover:bg-cream/30 transition-colors"
                      >
                        {/* Timeline dot */}
                        <div className="relative flex flex-col items-center">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: `var(--${meta.color})`,
                            }}
                          />
                          {index < recentAuditLogs.length - 1 && (
                            <div className="w-px h-6 bg-stone/30 absolute top-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {log.action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                          </p>
                          <p className="text-xs text-ink/40">
                            {log.entityType} {log.userEmail ? `\u00b7 ${log.userEmail}` : ""}
                          </p>
                        </div>
                        <p className="text-xs text-ink/40 whitespace-nowrap">
                          {timeAgo(log.timestamp, d)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-stone/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-ink/30" />
                  </div>
                  <p className="font-medium text-ink/50">
                    {d.noRecentActivity}
                  </p>
                  <p className="text-sm text-ink/35 mt-1">
                    {d.noRecentActivityDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== NEW USERS: Onboarding Checklist ===== */}
      {!isSetupComplete && (
        <>
          {/* Warm Header */}
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-cream/50 p-8 md:p-10 animate-fade-up">
            <div
              className="warm-orb w-[350px] h-[350px] -top-28 -right-28"
              style={{
                background:
                  "radial-gradient(circle, var(--terracotta), transparent)",
              }}
            />
            <div className="relative">
              <h1 className="font-display text-4xl md:text-5xl mb-3">
                {d.title}
              </h1>
              <p className="text-ink/50 text-lg">{d.incompleteMessage}</p>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone/40 mb-6 card-hover animate-fade-up delay-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl">{d.getStarted}</h2>
                <p className="text-ink/50 text-sm">{d.completeSteps}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display text-terracotta">
                  {completedSteps}/{totalSteps}
                </p>
                <p className="text-xs text-ink/50">{d.stepsComplete}</p>
              </div>
            </div>
            <div className="h-2.5 bg-stone/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(completedSteps / totalSteps) * 100}%`,
                  background:
                    "linear-gradient(90deg, var(--terracotta), var(--gold))",
                }}
              />
            </div>
          </div>

          {/* Next Action Highlight */}
          {nextStep && (
            <div className="bg-white rounded-2xl p-6 border border-ocean/30 mb-6 card-hover animate-fade-up delay-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
                  <nextStep.icon className="w-6 h-6 text-ocean" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {d.next} {nextStep.title}
                  </p>
                  <p className="text-sm text-ink/50">{nextStep.description}</p>
                </div>
                <Link
                  href={nextStep.href}
                  className="px-4 py-2 bg-ocean text-white rounded-lg font-medium hover:bg-ocean/90 transition-colors flex items-center gap-2"
                >
                  {d.getStartedButton}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Setup Checklist */}
          <div className="bg-white rounded-2xl border border-stone/40 mb-8 overflow-hidden animate-fade-up delay-3">
            <div className="p-6 border-b border-stone/20">
              <h2 className="font-display text-xl">{d.setupChecklist}</h2>
              <p className="text-ink/50 text-sm">
                {d.setupChecklistDescription}
              </p>
            </div>
            <div className="p-4 space-y-2">
              {stepsWithCompletion.map((step, index) => {
                const delayClass = `delay-${Math.min(index + 4, 8)}`;
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={`card-hover flex items-center gap-4 p-4 rounded-xl transition-colors animate-fade-up ${delayClass} ${
                      step.completed
                        ? "bg-forest/5 border border-forest/20"
                        : "bg-cream/50 hover:bg-stone/20 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        step.completed
                          ? "bg-forest/20 text-forest"
                          : "bg-stone/40 text-ink/50"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${step.completed ? "text-forest line-through" : ""}`}
                      >
                        {step.title}
                      </p>
                      <p className="text-sm text-ink/50">{step.description}</p>
                    </div>
                    {!step.completed && (
                      <ArrowRight className="w-5 h-5 text-ink/30" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
