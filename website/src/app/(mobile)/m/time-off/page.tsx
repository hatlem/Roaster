import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

async function getTimeOffRequests(userId: string) {
  try {
    return await prisma.timeOffRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch {
    return [];
  }
}

async function getAccrualBalance(userId: string) {
  const year = new Date().getFullYear();
  try {
    return await prisma.accrualBalance.findFirst({
      where: { userId, year, type: "VACATION" },
    });
  } catch {
    return null;
  }
}

export default async function TimeOffPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [requests, balance] = await Promise.all([
    getTimeOffRequests(session.user.id),
    getAccrualBalance(session.user.id),
  ]);

  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const t = dict.mobile.timeOff;

  const statusLabels: Record<string, string> = {
    APPROVED: t.approved,
    PENDING: t.pending,
    REJECTED: t.rejected,
    CANCELLED: t.cancelled,
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">{t.title}</h1>
        <Link
          href="/m/time-off/new"
          className="bg-ocean text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2"
        >
          <i className="fas fa-plus" />
          {t.request}
        </Link>
      </div>

      {/* Balance Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone/30 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-ocean/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-umbrella-beach text-ocean text-xl" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-ink/60">{t.vacationBalance}</p>
            <p className="text-2xl font-display">
              {balance ? Number(balance.remainingDays).toFixed(1) : "25"} {t.days}
            </p>
          </div>
        </div>
        {balance && (
          <div className="mt-3 pt-3 border-t border-stone/20 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-display text-forest">
                {Number(balance.earnedDays).toFixed(1)}
              </p>
              <p className="text-xs text-ink/60">{t.earned}</p>
            </div>
            <div>
              <p className="text-lg font-display text-terracotta">
                {Number(balance.usedDays).toFixed(1)}
              </p>
              <p className="text-xs text-ink/60">{t.used}</p>
            </div>
            <div>
              <p className="text-lg font-display text-ocean">
                {Number(balance.remainingDays).toFixed(1)}
              </p>
              <p className="text-xs text-ink/60">{t.available}</p>
            </div>
          </div>
        )}
      </div>

      {/* Requests */}
      <h2 className="font-semibold mb-3">{t.myRequests}</h2>
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-stone/30 text-center">
          <i className="fas fa-calendar-times text-3xl mb-3 text-stone" />
          <p className="text-ink/60">{t.noRequests}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const startDate = new Date(request.startDate);
            const endDate = new Date(request.endDate);

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl p-4 border border-stone/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{request.type.replace("_", " ")}</p>
                    <p className="text-sm text-ink/60">
                      {startDate.toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                      })}
                      {startDate.getTime() !== endDate.getTime() && (
                        <>
                          {" "}-{" "}
                          {endDate.toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      request.status === "APPROVED"
                        ? "bg-forest/10 text-forest"
                        : request.status === "PENDING"
                          ? "bg-gold/10 text-gold"
                          : request.status === "REJECTED"
                            ? "bg-terracotta/10 text-terracotta"
                            : "bg-stone/30 text-ink/60"
                    }`}
                  >
                    {statusLabels[request.status] || request.status}
                  </span>
                </div>
                <p className="text-sm text-ink/60">
                  {Number(request.totalDays).toFixed(1)} {Number(request.totalDays) !== 1 ? t.days : t.day}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
