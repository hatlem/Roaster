import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { ReportExportButton } from "@/components/dashboard/ReportExportButton";
import { AuditActivityChart } from "@/components/dashboard/ReportCharts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.reports.auditTitle };
}

async function getAuditData(orgId: string) {
  try {
    // Get audit logs tied to rosters in this org
    const rosterLogs = await prisma.auditLog.findMany({
      where: {
        roster: { organizationId: orgId },
      },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    // Also get logs tied to users in this org (not linked to a roster)
    const orgUserIds = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });
    const userIds = orgUserIds.map(u => u.id);

    const userLogs = await prisma.auditLog.findMany({
      where: {
        userId: { in: userIds },
        rosterId: null,
      },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    const allLogs = [...rosterLogs, ...userLogs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    const rosterChanges = allLogs.filter(l => l.entityType === "Roster").length;
    const shiftUpdates = allLogs.filter(l => l.entityType === "Shift").length;
    const userActions = allLogs.filter(l => l.entityType === "User").length;

    return {
      totalEvents: allLogs.length,
      rosterChanges,
      shiftUpdates,
      userActions,
      logs: allLogs,
    };
  } catch {
    return {
      totalEvents: 0,
      rosterChanges: 0,
      shiftUpdates: 0,
      userActions: 0,
      logs: [],
    };
  }
}

export default async function AuditReportPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as { organizationId?: string })?.organizationId;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.reports;

  const data = orgId ? await getAuditData(orgId) : null;
  const { totalEvents, rosterChanges, shiftUpdates, userActions, logs } = data || {
    totalEvents: 0,
    rosterChanges: 0,
    shiftUpdates: 0,
    userActions: 0,
    logs: [],
  };

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--stone), transparent)", opacity: 0.08 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/reports"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4 animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToReports}
          </Link>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-1">{d.auditTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-2">{d.auditSubtitle}</p>
        </div>
      </div>

      {/* Info Box with gradient line */}
      <div className="relative bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6 overflow-hidden animate-fade-up delay-2">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-info-circle text-ocean" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">{d.retentionPolicyTitle}</h3>
            <p className="text-ink/60 text-sm">
              {d.retentionPolicyDescription}
            </p>
          </div>
        </div>
        {/* Gradient line under retention policy */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ocean via-forest to-transparent" />
      </div>

      {/* Filters */}
      <div className="bg-stone/10 rounded-2xl p-6 border border-stone/30 mb-6 animate-fade-up delay-3">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{d.dateRange}</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="px-4 py-2 bg-white border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
              <span className="py-2 text-ink/50">{d.to}</span>
              <input
                type="date"
                className="px-4 py-2 bg-white border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.actionType}</label>
            <select className="px-4 py-2 bg-white border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="">{d.allActions}</option>
              <option value="create">{d.created}</option>
              <option value="update">{d.updated}</option>
              <option value="delete">{d.deleted}</option>
              <option value="publish">{d.publishedAction}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.user}</label>
            <select className="px-4 py-2 bg-white border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean">
              <option value="">{d.allUsers}</option>
            </select>
          </div>
          <button className="bg-ocean text-white px-6 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
            {d.filter}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-stone to-stone/20" />
          <p className="text-3xl font-display">{totalEvents}</p>
          <p className="text-ink/60 text-sm">{d.totalEvents}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-forest to-forest/40" />
          <p className="text-3xl font-display text-forest">{rosterChanges}</p>
          <p className="text-ink/60 text-sm">{d.rosterChanges}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ocean to-ocean/40" />
          <p className="text-3xl font-display text-ocean">{shiftUpdates}</p>
          <p className="text-ink/60 text-sm">{d.shiftUpdates}</p>
        </div>
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-6">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold to-gold/40" />
          <p className="text-3xl font-display text-gold">{userActions}</p>
          <p className="text-ink/60 text-sm">{d.userActions}</p>
        </div>
      </div>

      {/* Activity Breakdown Chart */}
      {totalEvents > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6 animate-fade-up delay-7">
          <h2 className="font-display text-xl mb-4">{d.auditTitle}</h2>
          <AuditActivityChart
            data={[
              { type: d.rosterChanges, count: rosterChanges },
              { type: d.shiftUpdates, count: shiftUpdates },
              { type: d.userActions, count: userActions },
            ].filter(d => d.count > 0)}
          />
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{d.auditLog}</h2>
          <ReportExportButton reportType="audit" format="csv" label={d.exportForAudit} icon="fas fa-download" className="border border-stone/50 px-4 py-2 rounded-xl font-medium hover:bg-cream transition-colors" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-dark/5 border-b border-stone/50">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">{d.timestamp}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.user}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.action}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.resource}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.details}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <tr key={log.id} className={`border-b border-stone/30 ${idx % 2 === 0 ? "bg-cream/30" : "bg-white"}`}>
                    <td className="p-3 text-sm text-ink/60">{new Date(log.timestamp).toLocaleString(locale)}</td>
                    <td className="p-3 text-sm">{log.userEmail || "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        log.action.includes("CREATE") ? "bg-forest/10 text-forest" :
                        log.action.includes("DELETE") ? "bg-terracotta/10 text-terracotta" :
                        log.action.includes("PUBLISH") ? "bg-ocean/10 text-ocean" :
                        "bg-gold/10 text-gold"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{log.entityType}</td>
                    <td className="p-3 text-sm text-ink/60 max-w-[200px] truncate">
                      {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || "-")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center py-10">
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone/40 bg-cream/50 flex items-center justify-center mb-4">
                        <i className="fas fa-history text-2xl text-stone/60" />
                      </div>
                      <p className="text-ink/60 font-medium mb-1">{d.noAuditEvents}</p>
                      <p className="text-ink/40 text-sm">{d.noAuditEventsHint}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
