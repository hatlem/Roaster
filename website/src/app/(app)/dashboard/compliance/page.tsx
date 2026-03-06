import { complianceStats } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.compliance.title };
}

export default async function CompliancePage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.compliance;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">{d.title}</h1>
        <p className="text-ink/60">{d.subtitle}</p>
      </div>

      {/* Compliance Score */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-shield-alt text-forest text-xl" />
            </div>
            <span className="text-xs font-medium text-forest bg-forest/10 px-2 py-1 rounded-full">
              {d.excellent}
            </span>
          </div>
          <p className="font-display text-3xl mb-1">{complianceStats.complianceRate}</p>
          <p className="text-ink/60 text-sm">{d.overallComplianceRate}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-clock text-ocean text-xl" />
            </div>
          </div>
          <p className="font-display text-3xl mb-1">0</p>
          <p className="text-ink/60 text-sm">{d.restPeriodViolations}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-hourglass-half text-gold text-xl" />
            </div>
          </div>
          <p className="font-display text-3xl mb-1">0</p>
          <p className="text-ink/60 text-sm">{d.overtimeLimitViolations}</p>
        </div>
      </div>

      {/* Compliance Rules */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-8">
        <h2 className="font-display text-xl mb-6">{d.activeComplianceRules}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">{d.publicationRuleTitle}</p>
                <p className="text-ink/60 text-sm">{d.publicationRuleDesc}</p>
              </div>
            </div>
            <span className="text-forest font-medium">{d.active}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">{d.dailyRestTitle}</p>
                <p className="text-ink/60 text-sm">{d.dailyRestDesc}</p>
              </div>
            </div>
            <span className="text-forest font-medium">{d.active}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">{d.weeklyRestTitle}</p>
                <p className="text-ink/60 text-sm">{d.weeklyRestDesc}</p>
              </div>
            </div>
            <span className="text-forest font-medium">{d.active}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">{d.workLimitsTitle}</p>
                <p className="text-ink/60 text-sm">{d.workLimitsDesc}</p>
              </div>
            </div>
            <span className="text-forest font-medium">{d.active}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">{d.overtimeLimitsTitle}</p>
                <p className="text-ink/60 text-sm">{d.overtimeLimitsDesc}</p>
              </div>
            </div>
            <span className="text-forest font-medium">{d.active}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">{d.auditRetentionTitle}</p>
                <p className="text-ink/60 text-sm">{d.auditRetentionDesc}</p>
              </div>
            </div>
            <span className="text-forest font-medium">{d.active}</span>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <h2 className="font-display text-xl mb-6">{d.recentAuditLog}</h2>
        <div className="text-center py-8 text-ink/60">
          <i className="fas fa-clipboard-list text-4xl mb-4 text-stone" />
          <p>{d.noComplianceEvents}</p>
          <p className="text-sm">{d.auditLogAutomatic}</p>
        </div>
      </div>
    </div>
  );
}
