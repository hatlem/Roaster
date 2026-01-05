import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Shift Requests",
};

async function getMyListings(userId: string) {
  try {
    return await prisma.shiftMarketplaceListing.findMany({
      where: { postedBy: userId },
      include: {
        shift: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            roster: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        claimedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
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
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            roster: {
              select: {
                id: true,
                name: true,
              },
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

  const [myListings, claimedShifts] = await Promise.all([
    getMyListings(session.user.id),
    getMyClaimedShifts(session.user.id),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/marketplace"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          Back to Marketplace
        </Link>
        <h1 className="font-display text-4xl mb-2">My Shift Requests</h1>
        <p className="text-ink/60">Shifts you&apos;ve posted and claimed</p>
      </div>

      {/* Shifts I've Posted */}
      <div className="mb-8">
        <h2 className="font-display text-xl mb-4">Shifts I&apos;ve Posted</h2>
        {myListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone/50 text-center">
            <i className="fas fa-upload text-3xl mb-3 text-stone" />
            <p className="text-ink/60">You haven&apos;t posted any shifts</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-cream border-b border-stone/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Shift</th>
                  <th className="text-left p-4 font-semibold text-sm">Mode</th>
                  <th className="text-left p-4 font-semibold text-sm">Claimed By</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-sm">Expires</th>
                </tr>
              </thead>
              <tbody>
                {myListings.map((listing) => {
                  const startTime = new Date(listing.shift.startTime);
                  const endTime = new Date(listing.shift.endTime);

                  return (
                    <tr key={listing.id} className="border-b border-stone/30">
                      <td className="p-4">
                        <p className="font-medium">
                          {startTime.toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="text-sm text-ink/60">
                          {startTime.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {endTime.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
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
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
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
                        {new Date(listing.availableUntil).toLocaleDateString("en-GB")}
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
        <h2 className="font-display text-xl mb-4">Shifts I&apos;ve Claimed</h2>
        {claimedShifts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone/50 text-center">
            <i className="fas fa-hand-paper text-3xl mb-3 text-stone" />
            <p className="text-ink/60">You haven&apos;t claimed any shifts</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-cream border-b border-stone/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Shift</th>
                  <th className="text-left p-4 font-semibold text-sm">Original Owner</th>
                  <th className="text-left p-4 font-semibold text-sm">Roster</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-sm">Claimed</th>
                </tr>
              </thead>
              <tbody>
                {claimedShifts.map((listing) => {
                  const startTime = new Date(listing.shift.startTime);
                  const endTime = new Date(listing.shift.endTime);

                  return (
                    <tr key={listing.id} className="border-b border-stone/30">
                      <td className="p-4">
                        <p className="font-medium">
                          {startTime.toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="text-sm text-ink/60">
                          {startTime.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {endTime.toLocaleTimeString("en-GB", {
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
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
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
                            ? "Pending Approval"
                            : listing.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-ink/60">
                        {listing.claimedAt
                          ? new Date(listing.claimedAt).toLocaleDateString("en-GB")
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
