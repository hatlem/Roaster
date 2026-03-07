import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.marketplace.myRequestsTitle };
}

async function getMyListings(userId: string) {
  try {
    return await prisma.shiftMarketplaceListing.findMany({
      where: { postedBy: userId },
      include: {
        shift: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
            roster: {
              select: { id: true, name: true },
            },
          },
        },
        claimedByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { postedAt: "desc" },
    });
  } catch {
    return [];
  }
}

async function getMyClaimedShifts(userId: string) {
  try {
    return await prisma.shiftMarketplaceListing.findMany({
      where: { claimedBy: userId },
      include: {
        shift: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
            roster: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { claimedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function MyRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.marketplace;

  const [myListings, claimedShifts] = await Promise.all([
    getMyListings(session.user.id),
    getMyClaimedShifts(session.user.id),
  ]);

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--terracotta), transparent)", opacity: 0.07 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/marketplace"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4 animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToMarketplace}
          </Link>
          <p className="text-terracotta mb-3 tracking-widest uppercase text-xs font-semibold animate-fade-up delay-1">
            {d.myRequestsTitle}
          </p>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-2">{d.myRequestsTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-3">{d.myRequestsSubtitle}</p>
        </div>
      </div>

      {/* Shifts I've Posted */}
      <div className="mb-10">
        <div className="mb-5">
          <h2 className="font-display text-2xl mb-2">{d.shiftsPosted}</h2>
          <div className="accent-line w-24" />
        </div>
        {myListings.length === 0 ? (
          <div className="relative bg-cream/30 rounded-2xl p-10 border border-dashed border-stone text-center overflow-hidden animate-fade-up delay-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-dashed border-stone flex items-center justify-center">
              <i className="fas fa-upload text-2xl text-stone" />
            </div>
            <p className="text-ink/60">{d.noShiftsPosted}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden animate-fade-up delay-4">
            <table className="w-full">
              <thead className="bg-cream border-b border-stone/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">{d.shift}</th>
                  <th className="text-left p-4 font-semibold text-sm">{d.mode}</th>
                  <th className="text-left p-4 font-semibold text-sm">{d.claimedBy}</th>
                  <th className="text-left p-4 font-semibold text-sm">{d.statusLabel || 'Status'}</th>
                  <th className="text-left p-4 font-semibold text-sm">{d.expiresLabel}</th>
                </tr>
              </thead>
              <tbody>
                {myListings.map((listing) => {
                  const startTime = new Date(listing.shift.startTime);
                  const endTime = new Date(listing.shift.endTime);

                  return (
                    <tr key={listing.id} className="border-b border-stone/30 even:bg-cream/30 card-hover">
                      <td className="p-4">
                        <p className="font-medium">
                          {startTime.toLocaleDateString(locale, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
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
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            listing.mode === "SELL"
                              ? "bg-forest/10 text-forest"
                              : listing.mode === "SWAP"
                                ? "bg-ocean/10 text-ocean"
                                : "bg-gold/10 text-gold"
                          }`}
                        >
                          {listing.mode}
                        </span>
                      </td>
                      <td className="p-4">
                        {listing.claimedByUser ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-ocean/10 rounded-full flex items-center justify-center">
                              <span className="text-ocean text-xs font-semibold">
                                {listing.claimedByUser.firstName[0]}
                                {listing.claimedByUser.lastName[0]}
                              </span>
                            </div>
                            <span className="text-sm">
                              {listing.claimedByUser.firstName}{" "}
                              {listing.claimedByUser.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink/40">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            listing.status === "AVAILABLE"
                              ? "bg-ocean/10 text-ocean"
                              : listing.status === "CLAIMED"
                                ? "bg-gold/10 text-gold"
                                : listing.status === "APPROVED"
                                  ? "bg-forest/10 text-forest"
                                  : listing.status === "REJECTED"
                                    ? "bg-terracotta/10 text-terracotta"
                                    : "bg-stone/30 text-ink/60"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-ink/60">
                        {new Date(listing.availableUntil).toLocaleDateString(locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shifts I've Claimed */}
      <div>
        <div className="mb-5">
          <h2 className="font-display text-2xl mb-2">{d.shiftsClaimed}</h2>
          <div className="accent-line w-24" />
        </div>
        {claimedShifts.length === 0 ? (
          <div className="relative bg-cream/30 rounded-2xl p-10 border border-dashed border-stone text-center overflow-hidden animate-fade-up delay-5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-dashed border-stone flex items-center justify-center">
              <i className="fas fa-hand-paper text-2xl text-stone" />
            </div>
            <p className="text-ink/60">{d.noShiftsClaimed}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden animate-fade-up delay-5">
            <table className="w-full">
              <thead className="bg-cream border-b border-stone/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">{d.shift}</th>
                  <th className="text-left p-4 font-semibold text-sm">{d.originalOwner}</th>
                  <th className="text-left p-4 font-semibold text-sm">{d.rosterLabel}</th>
                  <th className="text-left p-4 font-semibold text-sm">{d.statusLabel || 'Status'}</th>
                  <th className="text-left p-4 font-semibold text-sm">{d.claimed}</th>
                </tr>
              </thead>
              <tbody>
                {claimedShifts.map((listing) => {
                  const startTime = new Date(listing.shift.startTime);
                  const endTime = new Date(listing.shift.endTime);

                  return (
                    <tr key={listing.id} className="border-b border-stone/30 even:bg-cream/30 card-hover">
                      <td className="p-4">
                        <p className="font-medium">
                          {startTime.toLocaleDateString(locale, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
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
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-ocean/10 rounded-full flex items-center justify-center">
                            <span className="text-ocean text-xs font-semibold">
                              {listing.shift.user?.firstName[0]}
                              {listing.shift.user?.lastName[0]}
                            </span>
                          </div>
                          <span className="text-sm">
                            {listing.shift.user?.firstName}{" "}
                            {listing.shift.user?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-ink/60">
                        {listing.shift.roster?.name}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            listing.status === "CLAIMED"
                              ? "bg-gold/10 text-gold"
                              : listing.status === "APPROVED"
                                ? "bg-forest/10 text-forest"
                                : listing.status === "REJECTED"
                                  ? "bg-terracotta/10 text-terracotta"
                                  : "bg-stone/30 text-ink/60"
                          }`}
                        >
                          {listing.status === "CLAIMED"
                            ? d.pendingApproval
                            : listing.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-ink/60">
                        {listing.claimedAt
                          ? new Date(listing.claimedAt).toLocaleDateString(locale)
                          : "-"}
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
