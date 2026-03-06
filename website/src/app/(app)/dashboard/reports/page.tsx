import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.title };
}

export default async function ReportsPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.reports;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">{d.title}</h1>
        <p className="text-ink/60">{d.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Compliance Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-shield-alt text-forest text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">{d.complianceReportTitle}</h3>
          <p className="text-ink/60 text-sm mb-4">
            {d.complianceReportDesc}
          </p>
          <Link
            href="/dashboard/reports/compliance"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            {d.generateReport} <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Working Hours Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-clock text-ocean text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">{d.workingHoursTitle}</h3>
          <p className="text-ink/60 text-sm mb-4">
            {d.workingHoursDesc}
          </p>
          <Link
            href="/dashboard/reports/hours"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            {d.generateReport} <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Overtime Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-terracotta/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-hourglass-half text-terracotta text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">{d.overtimeAnalysisTitle}</h3>
          <p className="text-ink/60 text-sm mb-4">
            {d.overtimeAnalysisDesc}
          </p>
          <Link
            href="/dashboard/reports/overtime"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            {d.generateReport} <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Labor Cost Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-coins text-gold text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">{d.laborCostsTitle}</h3>
          <p className="text-ink/60 text-sm mb-4">
            {d.laborCostsDesc}
          </p>
          <Link
            href="/dashboard/reports/costs"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            {d.generateReport} <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Attendance Report */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-user-check text-ocean text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">{d.attendanceTitle}</h3>
          <p className="text-ink/60 text-sm mb-4">
            {d.attendanceDesc}
          </p>
          <Link
            href="/dashboard/reports/attendance"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            {d.generateReport} <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors">
          <div className="w-12 h-12 bg-stone/30 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-history text-ink/60 text-xl" />
          </div>
          <h3 className="font-display text-xl mb-2">{d.auditTrailTitle}</h3>
          <p className="text-ink/60 text-sm mb-4">
            {d.auditTrailDesc}
          </p>
          <Link
            href="/dashboard/reports/audit"
            className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2"
          >
            {d.viewAuditLog} <i className="fas fa-arrow-right text-sm" />
          </Link>
        </div>
      </div>
    </div>
  );
}
