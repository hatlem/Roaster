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

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "PUBLISHED": return "bg-forest/10 text-forest border border-forest/20";
    case "DRAFT": return "bg-gold/10 text-gold border border-gold/20";
    case "IN_REVIEW": return "bg-ocean/10 text-ocean border border-ocean/20";
    default: return "bg-stone/30 text-ink/60 border border-stone/40";
  }
}

function getAvatarRingColor(isOvertime: boolean) {
  return isOvertime ? "ring-2 ring-gold/60" : "ring-2 ring-ocean/40";
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

  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

  // Visual timeline: compute which days have shifts
  const rosterDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const shiftDaySet = new Set<number>();
  for (const shift of roster.shifts) {
    const shiftStart = new Date(shift.startTime);
    const dayIndex = Math.floor((shiftStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < rosterDays) {
      shiftDaySet.add(dayIndex);
    }
  }
  const timelineDays = Array.from({ length: rosterDays }, (_, i) => shiftDaySet.has(i));

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[500px] h-[500px] -top-64 -right-40"
          style={{ background: "radial-gradient(circle, var(--ocean), transparent)", opacity: 0.07 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/rosters"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-6 transition-colors animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToRosters}
          </Link>
          <div className="flex items-center justify-between animate-fade-up delay-1">
            <div>
              <h1 className="font-display text-4xl md:text-5xl mb-2">{roster.name}</h1>
              <p className="text-ink/60 text-lg">
                <span className="font-medium text-ink/70">{startDate.toLocaleDateString(locale, dateOpts)}</span>
                <span className="mx-2 text-stone">—</span>
                <span className="font-medium text-ink/70">{endDate.toLocaleDateString(locale, dateOpts)}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-base font-semibold px-5 py-2 rounded-full ${getStatusBadgeClasses(roster.status)}`}>
                {roster.status}
              </span>
              {roster.status === "DRAFT" && (
                <button className="bg-ocean text-white px-5 py-2.5 rounded-xl font-medium hover:bg-ocean/90 transition-colors flex items-center gap-2">
                  <i className="fas fa-paper-plane" />
                  {d.publishRoster}
                </button>
              )}
            </div>
          </div>
          {/* Accent line */}
          <div className="accent-line w-full mt-6 animate-fade-up delay-2" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {/* Total Shifts */}
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-2">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ocean to-ocean/40" />
          <div className="w-10 h-10 bg-ocean/10 rounded-xl flex items-center justify-center mb-3">
            <i className="fas fa-layer-group text-ocean" />
          </div>
          <p className="text-3xl font-display">{roster._count.shifts}</p>
          <p className="text-ink/60 text-sm mt-1">{d.totalShifts}</p>
        </div>

        {/* Days Until Start */}
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-terracotta to-gold" />
          <div className="w-10 h-10 bg-terracotta/10 rounded-xl flex items-center justify-center mb-3">
            <i className="fas fa-hourglass-half text-terracotta" />
          </div>
          <p className="text-3xl font-display">{daysUntilStart > 0 ? daysUntilStart : 0}</p>
          <p className="text-ink/60 text-sm mt-1">{d.daysUntilStart}</p>
        </div>

        {/* Location */}
        <div className="relative bg-white rounded-2xl p-6 border border-stone/50 card-hover overflow-hidden animate-fade-up delay-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold to-gold/40" />
          <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mb-3">
            <i className="fas fa-map-marker-alt text-gold" />
          </div>
          <p className="text-3xl font-display truncate">{roster.location?.name || "All"}</p>
          <p className="text-ink/60 text-sm mt-1">{d.locationLabel}</p>
        </div>

        {/* 14-Day Compliance */}
        <div className={`relative rounded-2xl p-6 border card-hover overflow-hidden animate-fade-up delay-5 ${
          is14DayCompliant ? "bg-forest/5 border-forest/20" : "bg-terracotta/5 border-terracotta/20"
        }`}>
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
            is14DayCompliant ? "from-forest to-forest/40" : "from-terracotta to-terracotta/40"
          }`} />
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            is14DayCompliant ? "bg-forest/10" : "bg-terracotta/10"
          }`}>
            {is14DayCompliant ? (
              <i className="fas fa-check-circle text-forest text-lg animate-fade-up" />
            ) : (
              <i className="fas fa-exclamation-circle text-terracotta text-lg animate-pulse" />
            )}
          </div>
          <p className={`text-3xl font-display ${is14DayCompliant ? "text-forest" : "text-terracotta"}`}>
            {is14DayCompliant ? d.yes : d.no}
          </p>
          <p className="text-ink/60 text-sm mt-1">{d.fourteenDayCompliant}</p>
        </div>
      </div>

      {/* 14-Day Rule Warning */}
      {!isPublished && daysUntilStart <= 14 && daysUntilStart > 0 && (
        <div className="relative bg-gold/10 rounded-2xl p-6 border border-gold/30 mb-8 overflow-hidden animate-fade-up delay-5">
          {/* Accent gradient at top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-terracotta via-gold to-terracotta/40" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-gold text-xl animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{d.fourteenDayDeadlineTitle}</h3>
              <p className="text-ink/60">
                {d.fourteenDayDeadlineDesc.replace('{days}', String(daysUntilStart))}
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <p className="text-4xl font-display text-gold font-bold leading-none">{daysUntilStart}</p>
              <p className="text-xs text-gold/70 font-medium uppercase tracking-wider mt-1">{d.daysUntilStart}</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline */}
      {roster.shifts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-8 animate-fade-up delay-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">{d.period}</h3>
            <p className="text-sm text-ink/50">
              {shiftDaySet.size} / {rosterDays} {d.daysLabel}
            </p>
          </div>
          <div className="flex gap-[3px] flex-wrap">
            {timelineDays.map((hasShift, i) => {
              const dayDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
              const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
              return (
                <div
                  key={i}
                  className={`h-6 rounded-sm transition-colors ${
                    rosterDays <= 14 ? "flex-1 min-w-[20px]" : "w-3"
                  } ${
                    hasShift
                      ? isWeekend ? "bg-terracotta/70" : "bg-ocean"
                      : "bg-stone/30"
                  }`}
                  title={dayDate.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-5 mt-3 text-xs text-ink/50">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-ocean inline-block" />
              {d.weekday}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-terracotta/70 inline-block" />
              {d.weekend}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-stone/30 inline-block" />
              {d.noShiftsLabel}
            </span>
          </div>
        </div>
      )}

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 animate-fade-up delay-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl">{d.shiftsTitle}</h2>
          <RosterActions
            rosterId={roster.id}
            rosterName={roster.name}
            status={roster.status}
            hasShifts={roster.shifts.length > 0}
            dictionary={cd}
            locale={locale}
          />
        </div>

        {roster.shifts.length === 0 ? (
          <div className="relative text-center py-16 grain overflow-hidden rounded-xl">
            <div
              className="warm-orb w-[200px] h-[200px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ background: "radial-gradient(circle, var(--ocean), transparent)", opacity: 0.05 }}
            />
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-stone/40 rounded-2xl flex items-center justify-center">
                <i className="fas fa-calendar-alt text-3xl text-stone" />
              </div>
              <p className="text-ink/60 font-medium">{d.noShiftsAdded}</p>
              <p className="text-sm text-ink/40 mt-1">{d.noShiftsDescription}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stone/30">
            <table className="w-full">
              <thead className="bg-cream border-b border-stone/50">
                <tr>
                  <th className="text-left p-3 font-semibold text-sm text-ink/70">{d.employee}</th>
                  <th className="text-left p-3 font-semibold text-sm text-ink/70">{d.date}</th>
                  <th className="text-left p-3 font-semibold text-sm text-ink/70">{d.time}</th>
                  <th className="text-left p-3 font-semibold text-sm text-ink/70">{d.duration}</th>
                  <th className="text-left p-3 font-semibold text-sm text-ink/70">{d.type}</th>
                  <th className="text-right p-3 font-semibold text-sm text-ink/70">{d.actions}</th>
                </tr>
              </thead>
              <tbody>
                {roster.shifts.map((shift) => {
                  const start = new Date(shift.startTime);
                  const end = new Date(shift.endTime);
                  const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                  return (
                    <tr key={shift.id} className="border-b border-stone/30 even:bg-cream/30 hover:bg-cream/50 transition-colors">
                      <td className="p-3">
                        {shift.user ? (
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 bg-ocean/10 rounded-full flex items-center justify-center ${getAvatarRingColor(shift.isOvertime)}`}>
                              <span className="text-ocean text-xs font-semibold">
                                {shift.user.firstName[0]}{shift.user.lastName[0]}
                              </span>
                            </div>
                            <span className="font-medium">{shift.user.firstName} {shift.user.lastName}</span>
                          </div>
                        ) : (
                          <span className="text-ink/40 italic">{d.unassigned}</span>
                        )}
                      </td>
                      <td className="p-3 text-ink/60">
                        {start.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
                      </td>
                      <td className="p-3 text-ink/60">
                        <span className="font-medium text-ink/70">{start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="mx-1.5 text-stone">—</span>
                        <span className="font-medium text-ink/70">{end.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="p-3 text-ink/60">{duration.toFixed(1)}h</td>
                      <td className="p-3">
                        {shift.isOvertime ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-gold/15 text-gold border border-gold/25 shadow-[0_0_8px_rgba(184,134,11,0.15)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                            {d.overtime}
                          </span>
                        ) : (
                          <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-ocean/10 text-ocean border border-ocean/20">
                            {d.regular}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-ocean hover:text-ocean/70 font-medium transition-colors">
                          {d.edit}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
