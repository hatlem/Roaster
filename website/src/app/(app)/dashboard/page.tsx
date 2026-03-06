import Link from "next/link";
import { CheckCircle2, ArrowRight, Calendar, Users, FileText, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.home.title };
}

async function getDashboardData() {
  try {
    const [employeeCount, rosterCount, publishedRosterCount] = await Promise.all([
      prisma.user.count({
        where: { isActive: true },
      }),
      prisma.roster.count(),
      prisma.roster.count({
        where: {
          status: { in: ["PUBLISHED", "ACTIVE"] },
        },
      }),
    ]);

    return {
      hasEmployees: employeeCount > 0,
      hasRosters: rosterCount > 0,
      hasPublished: publishedRosterCount > 0,
    };
  } catch {
    return {
      hasEmployees: false,
      hasRosters: false,
      hasPublished: false,
    };
  }
}

export default async function DashboardPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.home;
  const { hasEmployees, hasRosters, hasPublished } = await getDashboardData();

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
      index === 0 ? hasEmployees :
      index === 1 ? hasRosters :
      index === 2 ? hasRosters :
      hasPublished,
  }));

  const completedSteps = stepsWithCompletion.filter((s) => s.completed).length;
  const totalSteps = stepsWithCompletion.length;
  const isSetupComplete = completedSteps === totalSteps;
  const nextStep = stepsWithCompletion.find((s) => !s.completed);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">{d.title}</h1>
        <p className="text-ink/60">
          {isSetupComplete
            ? d.completeMessage
            : d.incompleteMessage}
        </p>
      </div>

      {/* Setup Progress Card - only show when incomplete */}
      {!isSetupComplete && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl">{d.getStarted}</h2>
              <p className="text-ink/60 text-sm">{d.completeSteps}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display text-forest">{completedSteps}/{totalSteps}</p>
              <p className="text-xs text-ink/60">{d.stepsComplete}</p>
            </div>
          </div>
          <div className="h-2 bg-stone/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Setup Complete Banner */}
      {isSetupComplete && (
        <div className="bg-forest/10 border border-forest/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-forest/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-forest" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-forest">{d.allSet}</p>
              <p className="text-sm text-ink/60">
                {d.allSetDescription}
              </p>
            </div>
            <Link
              href="/dashboard/compliance"
              className="px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90 transition-colors flex items-center gap-2"
            >
              {d.viewCompliance}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Next Action Highlight */}
      {nextStep && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
              <nextStep.icon className="w-6 h-6 text-ocean" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{d.next} {nextStep.title}</p>
              <p className="text-sm text-ink/60">{nextStep.description}</p>
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

      {/* Setup Checklist - only show when incomplete */}
      {!isSetupComplete && (
        <div className="bg-white rounded-2xl border border-stone/50 mb-8">
          <div className="p-6 border-b border-stone/30">
            <h2 className="font-display text-xl">{d.setupChecklist}</h2>
            <p className="text-ink/60 text-sm">{d.setupChecklistDescription}</p>
          </div>
          <div className="p-4 space-y-2">
            {stepsWithCompletion.map((step, index) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                    step.completed
                      ? "bg-forest/5 border border-forest/20"
                      : "bg-cream hover:bg-stone/30 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      step.completed
                        ? "bg-forest/20 text-forest"
                        : "bg-stone/50 text-ink/50"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${step.completed ? "text-forest line-through" : ""}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-ink/60">{step.description}</p>
                  </div>
                  {!step.completed && (
                    <ArrowRight className="w-5 h-5 text-ink/40" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions - show for active users */}
      {isSetupComplete && (
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/dashboard/rosters/new"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-stone/50 hover:border-ocean/50 transition-colors"
          >
            <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-ocean" />
            </div>
            <div>
              <p className="font-semibold">{d.createNewRoster}</p>
              <p className="text-sm text-ink/60">{d.scheduleNewPeriod}</p>
            </div>
          </Link>
          <Link
            href="/dashboard/employees/new"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-stone/50 hover:border-forest/50 transition-colors"
          >
            <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-forest" />
            </div>
            <div>
              <p className="font-semibold">{d.addEmployee}</p>
              <p className="text-sm text-ink/60">{d.onboardNewMember}</p>
            </div>
          </Link>
          <Link
            href="/dashboard/compliance"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-stone/50 hover:border-terracotta/50 transition-colors"
          >
            <div className="w-12 h-12 bg-terracotta/10 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <p className="font-semibold">{d.complianceReport}</p>
              <p className="text-sm text-ink/60">{d.generateDocumentation}</p>
            </div>
          </Link>
          <Link
            href="/dashboard/marketplace"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-stone/50 hover:border-gold/50 transition-colors"
          >
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="font-semibold">{d.shiftMarketplace}</p>
              <p className="text-sm text-ink/60">{d.manageShiftSwaps}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
