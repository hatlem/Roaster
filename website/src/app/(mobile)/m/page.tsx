import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

async function getUpcomingShifts(userId: string) {
  try {
    return await prisma.shift.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
      },
      include: {
        roster: {
          select: { name: true },
        },
      },
      orderBy: { startTime: "asc" },
      take: 3,
    });
  } catch {
    return [];
  }
}

export default async function MobileHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true },
  });

  const upcomingShifts = await getUpcomingShifts(session.user.id);

  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const t = dict.mobile.home;

  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? t.goodMorning
      : today.getHours() < 18
        ? t.goodAfternoon
        : t.goodEvening;

  return (
    <div className="p-4">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-ink/60 text-sm">{greeting},</p>
        <h1 className="font-display text-2xl">
          {user?.firstName} {user?.lastName}
        </h1>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/m/clock"
          className="bg-forest text-white rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]"
        >
          <i className="fas fa-play-circle text-3xl mb-2" />
          <span className="font-medium">{t.clockIn}</span>
        </Link>
        <Link
          href="/m/time-off/new"
          className="bg-ocean text-white rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]"
        >
          <i className="fas fa-umbrella-beach text-3xl mb-2" />
          <span className="font-medium">{t.requestTimeOff}</span>
        </Link>
      </div>

      {/* Upcoming Shifts */}
      <div className="bg-white rounded-2xl p-4 border border-stone/30 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t.upcomingShifts}</h2>
          <Link href="/m/schedule" className="text-ocean text-sm">
            {t.viewAll}
          </Link>
        </div>

        {upcomingShifts.length === 0 ? (
          <p className="text-ink/60 text-center py-4">{t.noUpcomingShifts}</p>
        ) : (
          <div className="space-y-3">
            {upcomingShifts.map((shift) => {
              const startTime = new Date(shift.startTime);
              const endTime = new Date(shift.endTime);
              const isToday =
                startTime.toDateString() === today.toDateString();

              return (
                <div
                  key={shift.id}
                  className={`p-3 rounded-xl ${
                    isToday ? "bg-ocean/10 border border-ocean/30" : "bg-cream"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                        isToday ? "bg-ocean text-white" : "bg-stone/20"
                      }`}
                    >
                      <span className="text-sm font-bold">
                        {startTime.getDate()}
                      </span>
                      <span className="text-xs">
                        {startTime.toLocaleDateString(locale, {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {startTime.toLocaleDateString(locale, {
                          weekday: "long",
                        })}
                        {isToday && (
                          <span className="ml-2 text-xs text-ocean">{t.today}</span>
                        )}
                      </p>
                      <p className="text-sm text-ink/60">
                        {startTime.toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {endTime.toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Marketplace Shortcut */}
      <Link
        href="/m/shifts"
        className="bg-white rounded-2xl p-4 border border-stone/30 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
          <i className="fas fa-exchange-alt text-gold text-xl" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{t.shiftMarketplace}</p>
          <p className="text-sm text-ink/60">{t.claimOrSwapShifts}</p>
        </div>
        <i className="fas fa-chevron-right text-ink/30" />
      </Link>
    </div>
  );
}
