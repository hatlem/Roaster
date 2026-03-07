import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.rosters.title };
}

async function getRosters() {
  try {
    const rosters = await prisma.roster.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { shifts: true },
        },
      },
    });
    return rosters;
  } catch {
    return [];
  }
}

function getStatusDotColor(status: string) {
  switch (status) {
    case "PUBLISHED": return "bg-forest";
    case "DRAFT": return "bg-gold";
    case "IN_REVIEW": return "bg-ocean";
    default: return "bg-stone";
  }
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "PUBLISHED": return "bg-forest/10 text-forest border border-forest/20";
    case "DRAFT": return "bg-gold/10 text-gold border border-gold/20";
    case "IN_REVIEW": return "bg-ocean/10 text-ocean border border-ocean/20";
    default: return "bg-stone/30 text-ink/60 border border-stone/40";
  }
}

export default async function RostersPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.rosters;
  const rosters = await getRosters();

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--ocean), transparent)", opacity: 0.07 }}
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ocean mb-3 tracking-widest uppercase text-xs font-semibold animate-fade-up">
                {d.title}
              </p>
              <div className="flex items-center gap-4 animate-fade-up delay-1">
                <h1 className="font-display text-4xl md:text-5xl">{d.title}</h1>
                {rosters.length > 0 && (
                  <span className="bg-ocean/10 text-ocean text-sm font-semibold px-3 py-1 rounded-full border border-ocean/20">
                    {rosters.length}
                  </span>
                )}
              </div>
              <p className="text-ink/60 text-lg mt-3 animate-fade-up delay-2">{d.subtitle}</p>
            </div>
            <Link
              href="/dashboard/rosters/new"
              className="bg-ocean text-white px-6 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-colors flex items-center gap-2 animate-fade-up delay-2"
            >
              <i className="fas fa-plus" />
              {d.createRoster}
            </Link>
          </div>
        </div>
      </div>

      {rosters.length === 0 ? (
        /* Empty state */
        <div className="relative bg-cream/40 rounded-2xl p-16 border-2 border-dashed border-stone/40 text-center grain overflow-hidden animate-fade-up delay-3">
          <div
            className="warm-orb w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ background: "radial-gradient(circle, var(--ocean), transparent)", opacity: 0.06 }}
          />
          <div className="relative">
            {/* Dashed calendar illustration */}
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-2 border-dashed border-ocean/30 rounded-2xl" />
              <div className="absolute top-0 left-3 right-3 h-3 border-b-2 border-dashed border-ocean/30 rounded-t-2xl" />
              <div className="absolute inset-0 flex items-center justify-center pt-2">
                <i className="fas fa-calendar-alt text-ocean text-3xl opacity-60" />
              </div>
            </div>
            <h2 className="font-display text-2xl mb-2">{d.noRostersTitle}</h2>
            <p className="text-ink/60 mb-8 max-w-md mx-auto">{d.noRostersDescription}</p>
            <Link
              href="/dashboard/rosters/new"
              className="inline-flex items-center gap-2 bg-ocean text-white px-6 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-colors"
            >
              <i className="fas fa-plus" />
              {d.createFirstRoster}
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden animate-fade-up delay-3">
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm text-ink/70">{d.name}</th>
                <th className="text-left p-4 font-semibold text-sm text-ink/70">{d.period}</th>
                <th className="text-left p-4 font-semibold text-sm text-ink/70">{d.status}</th>
                <th className="text-left p-4 font-semibold text-sm text-ink/70">{d.shifts}</th>
                <th className="text-left p-4 font-semibold text-sm text-ink/70">{d.published}</th>
                <th className="text-right p-4 font-semibold text-sm text-ink/70">{d.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rosters.map((roster) => {
                const start = new Date(roster.startDate);
                const end = new Date(roster.endDate);
                const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

                return (
                  <tr
                    key={roster.id}
                    className="border-b border-stone/30 even:bg-cream/30 card-hover cursor-pointer transition-colors hover:bg-cream/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusDotColor(roster.status)}`} />
                        <p className="font-medium">{roster.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-ink/60">
                      <span className="font-medium text-ink/80">{start.toLocaleDateString(locale, dateOpts)}</span>
                      <span className="mx-2 text-stone">—</span>
                      <span className="font-medium text-ink/80">{end.toLocaleDateString(locale, dateOpts)}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-sm font-medium px-3 py-1.5 rounded-full ${getStatusBadgeClasses(roster.status)}`}
                      >
                        {roster.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-ink/60">
                        <i className="fas fa-layer-group text-xs text-ocean/50" />
                        {roster._count.shifts}
                      </span>
                    </td>
                    <td className="p-4 text-ink/60">
                      {roster.publishedAt
                        ? new Date(roster.publishedAt).toLocaleDateString(locale, dateOpts)
                        : <span className="text-stone">—</span>
                      }
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/dashboard/rosters/${roster.id}`}
                        className="inline-flex items-center gap-2 text-ocean hover:text-ocean/70 font-medium transition-colors"
                      >
                        {d.view}
                        <i className="fas fa-arrow-right text-xs" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
