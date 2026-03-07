import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.compliance.title };
}

async function getComplianceData() {
  try {
    const [rosterCount, shiftCount, overtimeShiftCount, restViolations, dailyLimitViolations, weeklyLimitViolations] = await Promise.all([
      prisma.roster.count({ where: { status: "PUBLISHED" } }),
      prisma.shift.count(),
      prisma.shift.count({ where: { isOvertime: true } }),
      prisma.shift.count({ where: { violatesRestPeriod: true } }),
      prisma.shift.count({ where: { violatesDailyLimit: true } }),
      prisma.shift.count({ where: { violatesWeeklyLimit: true } }),
    ]);

    const totalViolations = restViolations + dailyLimitViolations + weeklyLimitViolations;
    const complianceRate = shiftCount > 0
      ? Math.max(0, Math.min(100, ((shiftCount - totalViolations) / shiftCount) * 100))
      : 100;

    return {
      rosterCount,
      shiftCount,
      overtimeShiftCount,
      restViolations,
      dailyLimitViolations,
      weeklyLimitViolations,
      totalViolations,
      complianceRate: Math.round(complianceRate * 10) / 10,
    };
  } catch {
    return {
      rosterCount: 0,
      shiftCount: 0,
      overtimeShiftCount: 0,
      restViolations: 0,
      dailyLimitViolations: 0,
      weeklyLimitViolations: 0,
      totalViolations: 0,
      complianceRate: 100,
    };
  }
}

export default async function CompliancePage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.compliance;
  const data = await getComplianceData();

  // SVG circular progress ring calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.complianceRate / 100) * circumference;
  const rateColor = data.complianceRate >= 95 ? "text-forest" : data.complianceRate >= 80 ? "text-gold" : "text-terracotta";
  const rateStroke = data.complianceRate >= 95 ? "#2d5a4a" : data.complianceRate >= 80 ? "#b8860b" : "#c65d3b";
  const rateBadgeColor = data.complianceRate >= 95
    ? "text-forest bg-forest/10"
    : data.complianceRate >= 80
      ? "text-gold bg-gold/10"
      : "text-terracotta bg-terracotta/10";

  type RuleColor = "forest" | "terracotta" | "gold";

  const dailyRestColor: RuleColor = data.restViolations > 0 ? "terracotta" : "forest";
  const weeklyRestColor: RuleColor = data.weeklyLimitViolations > 0 ? "gold" : "forest";
  const workLimitsColor: RuleColor = data.dailyLimitViolations > 0 ? "terracotta" : "forest";
  const overtimeColor: RuleColor = data.overtimeShiftCount > 3 ? "gold" : "forest";

  const rules: Array<{ icon: string; title: string; desc: string; color: RuleColor; pct: number }> = [
    {
      icon: "fa-calendar",
      title: d.publicationRuleTitle,
      desc: d.publicationRuleDesc,
      color: "forest",
      pct: data.rosterCount > 0 ? 100 : 0,
    },
    {
      icon: "fa-moon",
      title: d.dailyRestTitle,
      desc: d.dailyRestDesc,
      color: dailyRestColor,
      pct: data.shiftCount > 0 ? Math.round(((data.shiftCount - data.restViolations) / data.shiftCount) * 100) : 100,
    },
    {
      icon: "fa-bed",
      title: d.weeklyRestTitle,
      desc: d.weeklyRestDesc,
      color: weeklyRestColor,
      pct: data.shiftCount > 0 ? Math.round(((data.shiftCount - data.weeklyLimitViolations) / data.shiftCount) * 100) : 100,
    },
    {
      icon: "fa-clock",
      title: d.workLimitsTitle,
      desc: d.workLimitsDesc,
      color: workLimitsColor,
      pct: data.shiftCount > 0 ? Math.round(((data.shiftCount - data.dailyLimitViolations) / data.shiftCount) * 100) : 100,
    },
    {
      icon: "fa-fire",
      title: d.overtimeLimitsTitle,
      desc: d.overtimeLimitsDesc,
      color: overtimeColor,
      pct: data.shiftCount > 0 ? Math.round(((data.shiftCount - data.overtimeShiftCount) / data.shiftCount) * 100) : 100,
    },
    {
      icon: "fa-archive",
      title: d.auditRetentionTitle,
      desc: d.auditRetentionDesc,
      color: "forest",
      pct: 100,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="relative overflow-hidden mb-10 animate-fade-up">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "linear-gradient(135deg, #2d5a4a, #3a6b7c)" }}
        />
        <div className="relative">
          <h1 className="font-display text-4xl mb-2">{d.title}</h1>
          <p className="text-ink/60 animate-fade-up delay-1">{d.subtitle}</p>
        </div>
      </div>

      {/* Compliance Score Hero + Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* Circular Progress Ring Card */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 flex flex-col items-center justify-center card-hover animate-fade-up delay-1">
          <div className="relative w-44 h-44 mb-4 animate-scale-in delay-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#e8e4dd"
                strokeWidth="10"
              />
              {/* Progress ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={rateStroke}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-display text-3xl ${rateColor}`}>
                {data.complianceRate}%
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${rateBadgeColor}`}>
                {d.excellent}
              </span>
            </div>
          </div>
          <p className="text-ink/60 text-sm text-center">{d.overallComplianceRate}</p>
        </div>

        {/* Rest Period Violations */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 card-hover animate-fade-up delay-2" style={{ borderTop: "2px solid #3a6b7c" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-clock text-ocean text-xl" />
            </div>
            {data.restViolations === 0 && (
              <span className="text-xs font-medium text-forest bg-forest/10 px-2 py-1 rounded-full">
                {d.excellent}
              </span>
            )}
          </div>
          <p className="font-display text-3xl mb-1">{data.restViolations}</p>
          <p className="text-ink/60 text-sm">{d.restPeriodViolations}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-ink/40">
            <i className="fas fa-shield-alt" />
            <span>{data.shiftCount} shifts monitored</span>
          </div>
        </div>

        {/* Overtime Limit Violations */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 card-hover animate-fade-up delay-3" style={{ borderTop: "2px solid #b8860b" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-hourglass-half text-gold text-xl" />
            </div>
            {data.overtimeShiftCount === 0 && (
              <span className="text-xs font-medium text-forest bg-forest/10 px-2 py-1 rounded-full">
                {d.excellent}
              </span>
            )}
          </div>
          <p className="font-display text-3xl mb-1">{data.overtimeShiftCount}</p>
          <p className="text-ink/60 text-sm">{d.overtimeLimitViolations}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-ink/40">
            <i className="fas fa-chart-bar" />
            <span>{data.rosterCount} published rosters</span>
          </div>
        </div>
      </div>

      {/* Compliance Rules */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-10 animate-fade-up delay-4">
        <h2 className="font-display text-xl mb-6">{d.activeComplianceRules}</h2>
        <div className="space-y-4">
          {rules.map((rule, i) => {
            const bgMap = { forest: "bg-forest/5", terracotta: "bg-terracotta/5", gold: "bg-gold/5" };
            const borderMap = { forest: "border-forest/20", terracotta: "border-terracotta/20", gold: "border-gold/20" };
            const iconBgMap = { forest: "bg-forest/10", terracotta: "bg-terracotta/10", gold: "bg-gold/10" };
            const textMap = { forest: "text-forest", terracotta: "text-terracotta", gold: "text-gold" };
            const barBgMap = { forest: "bg-forest", terracotta: "bg-terracotta", gold: "bg-gold" };

            return (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-xl border card-hover animate-fade-up delay-${Math.min(i + 4, 8)} ${bgMap[rule.color]} ${borderMap[rule.color]}`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgMap[rule.color]}`}>
                    <i className={`fas ${rule.icon} ${textMap[rule.color]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{rule.title}</p>
                    <p className="text-ink/60 text-sm">{rule.desc}</p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-stone/30 rounded-full overflow-hidden max-w-[200px]">
                      <div
                        className={`h-full rounded-full ${barBgMap[rule.color]}`}
                        style={{ width: `${rule.pct}%`, transition: "width 1s ease-in-out" }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className={`text-sm font-medium ${textMap[rule.color]}`}>
                    {rule.pct}%
                  </span>
                  <span className={`font-medium ${textMap[rule.color]}`}>{d.active}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log */}
      <div className="relative bg-white rounded-2xl p-6 border border-stone/50 overflow-hidden animate-fade-up delay-6">
        <div
          className="warm-orb w-[300px] h-[300px] -bottom-32 -right-24"
          style={{ background: "linear-gradient(135deg, #2d5a4a, #3a6b7c)", opacity: 0.06 }}
        />
        <div className="relative">
          <h2 className="font-display text-xl mb-6">{d.recentAuditLog}</h2>

          {/* Timeline placeholder */}
          <div className="flex flex-col items-center py-8 gap-6">
            {/* Timeline line with dashed circles */}
            <div className="relative w-full max-w-md">
              <div className="absolute left-6 top-0 bottom-0 w-px border-l-2 border-dashed border-stone/30" />

              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`relative flex items-center gap-4 mb-6 last:mb-0 animate-fade-up delay-${Math.min(i + 6, 8)}`}>
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-stone/30 flex items-center justify-center bg-stone/5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-stone/20" />
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-stone/10 rounded-full w-3/4 mb-1.5" />
                    <div className="h-2 bg-stone/5 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-2">
              <i className="fas fa-clipboard-list text-3xl mb-3 text-stone/40" />
              <p className="text-ink/50 font-medium">{d.noComplianceEvents}</p>
              <p className="text-sm text-ink/40 mt-1 max-w-sm">{d.auditLogAutomatic}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
