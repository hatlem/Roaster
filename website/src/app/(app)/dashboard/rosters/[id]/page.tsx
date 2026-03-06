import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RosterActions } from "@/components/scheduling/RosterActions";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getRoster(id: string) {
  try {
    const roster = await prisma.roster.findUnique({
      where: { id },
      include: {
        location: true,
        shifts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { startTime: "asc" },
          take: 50,
        },
        _count: {
          select: { shifts: true },
        },
      },
    });
    return roster;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const roster = await getRoster(id);
  return {
    title: roster ? roster.name : dict.dashboard.rosters.rosterNotFound,
  };
}

export default async function RosterDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.rosters;
  const cd = dict.dashboard.components;
  const roster = await getRoster(id);

  if (!roster) {
    notFound();
  }

  const startDate = new Date(roster.startDate);
  const endDate = new Date(roster.endDate);
  const publishedAt = roster.publishedAt ? new Date(roster.publishedAt) : null;

  // Check 14-day rule compliance
  const daysUntilStart = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPublished = roster.status === "PUBLISHED";
  const is14DayCompliant = !isPublished || (publishedAt && (startDate.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24) >= 14);

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/rosters"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          {d.backToRosters}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl mb-2">{roster.name}</h1>
            <p className="text-ink/60">
              {startDate.toLocaleDateString("en-GB")} - {endDate.toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              roster.status === "PUBLISHED"
                ? "bg-forest/10 text-forest"
                : roster.status === "DRAFT"
                ? "bg-gold/10 text-gold"
                : roster.status === "IN_REVIEW"
                ? "bg-ocean/10 text-ocean"
                : "bg-stone/30 text-ink/60"
            }`}>
              {roster.status}
            </span>
            {roster.status === "DRAFT" && (
              <button className="bg-ocean text-white px-4 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors flex items-center gap-2">
                <i className="fas fa-paper-plane" />
                {d.publishRoster}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">{roster._count.shifts}</p>
          <p className="text-ink/60 text-sm">{d.totalShifts}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">{daysUntilStart > 0 ? daysUntilStart : 0}</p>
          <p className="text-ink/60 text-sm">{d.daysUntilStart}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <p className="text-3xl font-display">{roster.location?.name || "All"}</p>
          <p className="text-ink/60 text-sm">{d.locationLabel}</p>
        </div>
        <div className={`rounded-2xl p-6 border ${
          is14DayCompliant ? "bg-forest/5 border-forest/20" : "bg-terracotta/5 border-terracotta/20"
        }`}>
          <p className={`text-3xl font-display ${is14DayCompliant ? "text-forest" : "text-terracotta"}`}>
            {is14DayCompliant ? d.yes : d.no}
          </p>
          <p className="text-ink/60 text-sm">{d.fourteenDayCompliant}</p>
        </div>
      </div>

      {/* 14-Day Rule Warning */}
      {!isPublished && daysUntilStart <= 14 && daysUntilStart > 0 && (
        <div className="bg-gold/10 rounded-2xl p-6 border border-gold/30 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-gold" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{d.fourteenDayDeadlineTitle}</h3>
              <p className="text-ink/60 text-sm">
                {d.fourteenDayDeadlineDesc.replace('{days}', String(daysUntilStart))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl">{d.shiftsTitle}</h2>
          <RosterActions
            rosterId={roster.id}
            rosterName={roster.name}
            status={roster.status}
            hasShifts={roster.shifts.length > 0}
            dictionary={cd}
          />
        </div>

        {roster.shifts.length === 0 ? (
          <div className="text-center py-12 text-ink/60">
            <i className="fas fa-calendar-alt text-4xl mb-4 text-stone" />
            <p>{d.noShiftsAdded}</p>
            <p className="text-sm">{d.noShiftsDescription}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/50">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">{d.employee}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.date}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.time}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.duration}</th>
                <th className="text-left p-3 font-semibold text-sm">{d.type}</th>
                <th className="text-right p-3 font-semibold text-sm">{d.actions}</th>
              </tr>
            </thead>
            <tbody>
              {roster.shifts.map((shift) => {
                const start = new Date(shift.startTime);
                const end = new Date(shift.endTime);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                return (
                  <tr key={shift.id} className="border-b border-stone/30 hover:bg-cream/50">
                    <td className="p-3">
                      {shift.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-ocean/10 rounded-full flex items-center justify-center">
                            <span className="text-ocean text-xs font-semibold">
                              {shift.user.firstName[0]}{shift.user.lastName[0]}
                            </span>
                          </div>
                          <span>{shift.user.firstName} {shift.user.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-ink/40">{d.unassigned}</span>
                      )}
                    </td>
                    <td className="p-3 text-ink/60">{start.toLocaleDateString("en-GB")}</td>
                    <td className="p-3 text-ink/60">
                      {start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} -
                      {end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3 text-ink/60">{duration.toFixed(1)}h</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        shift.isOvertime ? "bg-gold/10 text-gold" : "bg-ocean/10 text-ocean"
                      }`}>
                        {shift.isOvertime ? d.overtime : d.regular}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-ocean hover:text-ocean/70 font-medium">
                        {d.edit}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
