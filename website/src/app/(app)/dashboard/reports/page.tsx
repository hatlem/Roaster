import Link from "next/link";

export const metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Reports</h1>
        <p className="text-ink/60">Generate compliance and operational reports</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Compliance Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-shield-alt text-forest text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">Compliance Report</h3>
          <p className="text-ink/60 text-sm mb-4">
            Generate Arbeidstilsynet-ready compliance documentation for audits
          </p>
          <Link
            href="/dashboard/reports/compliance"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            Generate Report <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Working Hours Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-clock text-ocean text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">Working Hours</h3>
          <p className="text-ink/60 text-sm mb-4">
            Summary of scheduled and actual working hours per employee
          </p>
          <Link
            href="/dashboard/reports/hours"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            Generate Report <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Overtime Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-terracotta/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-hourglass-half text-terracotta text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">Overtime Analysis</h3>
          <p className="text-ink/60 text-sm mb-4">
            Track overtime hours against Norwegian labor law limits
          </p>
          <Link
            href="/dashboard/reports/overtime"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            Generate Report <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Labor Cost Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-coins text-gold text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">Labor Costs</h3>
          <p className="text-ink/60 text-sm mb-4">
            Analyze scheduled vs actual labor costs with budget variance
          </p>
          <Link
            href="/dashboard/reports/costs"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            Generate Report <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Attendance Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-user-check text-ocean text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">Attendance</h3>
          <p className="text-ink/60 text-sm mb-4">
            Track employee attendance, absences, and time-off usage
          </p>
          <Link
            href="/dashboard/reports/attendance"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            Generate Report <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-stone/30 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-history text-ink/60 text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">Audit Trail</h3>
          <p className="text-ink/60 text-sm mb-4">
            Complete log of all schedule changes for compliance verification
          </p>
          <Link
            href="/dashboard/reports/audit"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            View Audit Log <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>
      </div>
    </div>
  );
}
