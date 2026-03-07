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

  const reports = [
    {
      title: d.complianceReportTitle,
      desc: d.complianceReportDesc,
      href: "/dashboard/reports/compliance",
      icon: "fas fa-shield-alt",
      iconBg: "bg-forest/10",
      iconColor: "text-forest",
      accentGradient: "from-forest to-forest/40",
      cta: d.generateReport,
    },
    {
      title: d.workingHoursTitle,
      desc: d.workingHoursDesc,
      href: "/dashboard/reports/hours",
      icon: "fas fa-clock",
      iconBg: "bg-ocean/10",
      iconColor: "text-ocean",
      accentGradient: "from-ocean to-ocean/40",
      cta: d.generateReport,
    },
    {
      title: d.overtimeAnalysisTitle,
      desc: d.overtimeAnalysisDesc,
      href: "/dashboard/reports/overtime",
      icon: "fas fa-hourglass-half",
      iconBg: "bg-terracotta/10",
      iconColor: "text-terracotta",
      accentGradient: "from-terracotta to-gold",
      cta: d.generateReport,
    },
    {
      title: d.laborCostsTitle,
      desc: d.laborCostsDesc,
      href: "/dashboard/reports/costs",
      icon: "fas fa-coins",
      iconBg: "bg-gold/10",
      iconColor: "text-gold",
      accentGradient: "from-gold to-terracotta/40",
      cta: d.generateReport,
    },
    {
      title: d.attendanceTitle,
      desc: d.attendanceDesc,
      href: "/dashboard/reports/attendance",
      icon: "fas fa-user-check",
      iconBg: "bg-ocean/10",
      iconColor: "text-ocean",
      accentGradient: "from-ocean to-forest/40",
      cta: d.generateReport,
    },
    {
      title: d.auditTrailTitle,
      desc: d.auditTrailDesc,
      href: "/dashboard/reports/audit",
      icon: "fas fa-history",
      iconBg: "bg-stone/20",
      iconColor: "text-ink/60",
      accentGradient: "from-stone to-stone/20",
      cta: d.viewAuditLog,
    },
  ];

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--terracotta), transparent)", opacity: 0.07 }}
        />
        <div className="relative">
          <p className="text-terracotta mb-3 tracking-widest uppercase text-xs font-semibold animate-fade-up">
            {d.title}
          </p>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-1">{d.title}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-2">{d.subtitle}</p>
        </div>
      </div>

      {/* Stat summary row */}
      <div className="bg-cream/50 border border-stone/30 rounded-2xl px-6 py-4 mb-8 flex items-center gap-3 animate-fade-up delay-2">
        <div className="w-8 h-8 bg-ocean/10 rounded-lg flex items-center justify-center">
          <i className="fas fa-chart-bar text-ocean text-sm" />
        </div>
        <p className="text-ink/70 text-sm">
          <span className="font-semibold text-ink">6</span> report types available
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, i) => (
          <div
            key={report.href}
            className={`relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-${i + 1}`}
          >
            {/* Accent line at top */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${report.accentGradient}`} />

            <div className={`w-12 h-12 ${report.iconBg} rounded-xl flex items-center justify-center mb-4`}>
              <i className={`${report.icon} ${report.iconColor} text-xl`} />
            </div>
            <h3 className="font-display text-xl mb-2">{report.title}</h3>
            <p className="text-ink/60 text-sm mb-4">
              {report.desc}
            </p>
            <Link
              href={report.href}
              className="text-ocean font-medium hover:text-ocean/70 flex items-center gap-2 transition-colors"
            >
              {report.cta} <i className="fas fa-arrow-right text-sm" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
