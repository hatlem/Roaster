import { complianceStats } from "@/content";

export const metadata = {
  title: "Compliance",
};

export default function CompliancePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Compliance</h1>
        <p className="text-ink/60">Norwegian Labor Law (Arbeidsmiljoloven) compliance monitoring</p>
      </div>

      {/* Compliance Score */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-shield-alt text-forest text-xl" />
            </div>
            <span className="text-xs font-medium text-forest bg-forest/10 px-2 py-1 rounded-full">
              Excellent
            </span>
          </div>
          <p className="font-display text-3xl mb-1">{complianceStats.complianceRate}</p>
          <p className="text-ink/60 text-sm">Overall Compliance Rate</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-clock text-ocean text-xl" />
            </div>
          </div>
          <p className="font-display text-3xl mb-1">0</p>
          <p className="text-ink/60 text-sm">Rest Period Violations</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-hourglass-half text-gold text-xl" />
            </div>
          </div>
          <p className="font-display text-3xl mb-1">0</p>
          <p className="text-ink/60 text-sm">Overtime Limit Violations</p>
        </div>
      </div>

      {/* Compliance Rules */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-8">
        <h2 className="font-display text-xl mb-6">Active Compliance Rules</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">14-Day Publication Rule</p>
                <p className="text-ink/60 text-sm">Rosters must be published 14 days before start</p>
              </div>
            </div>
            <span className="text-forest font-medium">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">11-Hour Daily Rest</p>
                <p className="text-ink/60 text-sm">Minimum 11 hours between shifts</p>
              </div>
            </div>
            <span className="text-forest font-medium">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">35-Hour Weekly Rest</p>
                <p className="text-ink/60 text-sm">Minimum 35 consecutive hours rest per week</p>
              </div>
            </div>
            <span className="text-forest font-medium">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">9/40 Hour Work Limits</p>
                <p className="text-ink/60 text-sm">Max 9 hours/day and 40 hours/week normal work</p>
              </div>
            </div>
            <span className="text-forest font-medium">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">Overtime Limits (10h/25h/200h)</p>
                <p className="text-ink/60 text-sm">Weekly, monthly, and annual overtime caps</p>
              </div>
            </div>
            <span className="text-forest font-medium">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-forest/5 rounded-xl border border-forest/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-forest" />
              </div>
              <div>
                <p className="font-semibold">2-Year Audit Retention</p>
                <p className="text-ink/60 text-sm">All schedule changes logged for compliance audits</p>
              </div>
            </div>
            <span className="text-forest font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <h2 className="font-display text-xl mb-6">Recent Audit Log</h2>
        <div className="text-center py-8 text-ink/60">
          <i className="fas fa-clipboard-list text-4xl mb-4 text-stone" />
          <p>No compliance events to display</p>
          <p className="text-sm">All scheduling changes are automatically logged for auditing</p>
        </div>
      </div>
    </div>
  );
}
