import Link from "next/link";
import { CheckCircle2, ArrowRight, Calendar, Users, FileText, Clock } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

// Setup steps for new users
const setupSteps = [
  {
    id: "add-employees",
    title: "Add your employees",
    description: "Import or create employee profiles",
    href: "/dashboard/employees/new",
    icon: Users,
  },
  {
    id: "create-roster",
    title: "Create your first roster",
    description: "Set up a work schedule for your team",
    href: "/dashboard/rosters/new",
    icon: Calendar,
  },
  {
    id: "check-compliance",
    title: "Run compliance check",
    description: "Verify rest periods and working time rules",
    href: "/dashboard/compliance",
    icon: FileText,
  },
  {
    id: "publish-roster",
    title: "Publish to employees",
    description: "Share the schedule with your team",
    href: "/dashboard/rosters",
    icon: Clock,
  },
];

export default function DashboardPage() {
  // TODO: Replace with actual data from database
  const hasEmployees = false;
  const hasRosters = false;
  const hasPublished = false;

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
        <h1 className="font-display text-4xl mb-2">Dashboard</h1>
        <p className="text-ink/60">
          {isSetupComplete
            ? "Your rosters are compliant and published."
            : "Get started with Roaster to ensure compliance."}
        </p>
      </div>

      {/* Setup Progress Card - only show when incomplete */}
      {!isSetupComplete && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl">Get started with Roaster</h2>
              <p className="text-ink/60 text-sm">Complete these steps to ensure working time compliance</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display text-forest">{completedSteps}/{totalSteps}</p>
              <p className="text-xs text-ink/60">steps complete</p>
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
              <p className="font-semibold text-forest">You're all set!</p>
              <p className="text-sm text-ink/60">
                Your team has compliant schedules. Monitor compliance status below.
              </p>
            </div>
            <Link
              href="/dashboard/compliance"
              className="px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90 transition-colors flex items-center gap-2"
            >
              View Compliance
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
              <p className="font-semibold">Next: {nextStep.title}</p>
              <p className="text-sm text-ink/60">{nextStep.description}</p>
            </div>
            <Link
              href={nextStep.href}
              className="px-4 py-2 bg-ocean text-white rounded-lg font-medium hover:bg-ocean/90 transition-colors flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Setup Checklist - only show when incomplete */}
      {!isSetupComplete && (
        <div className="bg-white rounded-2xl border border-stone/50 mb-8">
          <div className="p-6 border-b border-stone/30">
            <h2 className="font-display text-xl">Setup checklist</h2>
            <p className="text-ink/60 text-sm">Complete each step to activate compliance monitoring</p>
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
              <p className="font-semibold">Create New Roster</p>
              <p className="text-sm text-ink/60">Schedule for a new period</p>
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
              <p className="font-semibold">Add Employee</p>
              <p className="text-sm text-ink/60">Onboard a new team member</p>
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
              <p className="font-semibold">Compliance Report</p>
              <p className="text-sm text-ink/60">Generate documentation</p>
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
              <p className="font-semibold">Shift Marketplace</p>
              <p className="text-sm text-ink/60">Manage shift swaps</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
