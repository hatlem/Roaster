import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClaimButton } from "@/components/marketplace/ClaimButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shift Marketplace",
};

async function getAvailableListings(organizationId: string, userId: string) {
  try {
    return await prisma.shiftMarketplaceListing.findMany({
      where: {
        status: "AVAILABLE",
        availableUntil: { gt: new Date() },
        postedBy: { not: userId }, // Don't show own listings
        shift: {
          roster: { organizationId },
        },
      },
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
      orderBy: { postedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  });

  if (!user?.organizationId) {
    redirect("/dashboard");
  }

  const listings = await getAvailableListings(user.organizationId, session.user.id);
  const isManager = ["ADMIN", "MANAGER"].includes(user.role);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl mb-2">Shift Marketplace</h1>
            <p className="text-ink/60">Find and claim available shifts</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/marketplace/my-requests"
              className="px-4 py-2 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors flex items-center gap-2"
            >
              <i className="fas fa-list" />
              My Requests
            </Link>
            {isManager && (
              <Link
                href="/dashboard/marketplace/approvals"
                className="px-4 py-2 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors flex items-center gap-2"
              >
                <i className="fas fa-check-circle" />
                Approvals
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mode Legend */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-forest" />
          <span className="text-ink/60">Sell - Anyone can claim</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-ocean" />
          <span className="text-ink/60">Swap - Exchange shifts</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-gold" />
          <span className="text-ink/60">Handover - Specific person</span>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone/50 text-center">
          <i className="fas fa-store text-4xl mb-4 text-stone" />
          <p className="text-lg font-medium mb-2">No shifts available</p>
          <p className="text-ink/60">
            When coworkers post shifts to the marketplace, they&apos;ll appear here
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const shift = listing.shift;
            const startTime = new Date(shift.startTime);
            const endTime = new Date(shift.endTime);
            const duration =
              (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl p-6 border border-stone/50 hover:border-ocean/50 transition-colors"
              >
                {/* Mode Badge */}
                <div className="flex items-center justify-between mb-4">
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
                  <span className="text-xs text-ink/60">
                    Expires{" "}
                    {new Date(listing.availableUntil).toLocaleDateString("en-GB")}
                  </span>
                </div>

                {/* Shift Details */}
                <div className="mb-4">
                  <p className="font-semibold text-lg">
                    {startTime.toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-ink/60">
                    {startTime.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {endTime.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <span className="ml-2">({duration.toFixed(1)}h)</span>
                  </p>
                </div>

                {/* Posted By */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-ocean/10 rounded-full flex items-center justify-center">
                    <span className="text-ocean text-xs font-semibold">
                      {shift.user?.firstName?.[0]}
                      {shift.user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {shift.user?.firstName} {shift.user?.lastName}
                    </p>
                    <p className="text-xs text-ink/60">
                      {shift.roster?.name}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                {listing.reason && (
                  <p className="text-sm text-ink/60 mb-4 italic">
                    &quot;{listing.reason}&quot;
                  </p>
                )}

                {/* Claim Button */}
                <ClaimButton listingId={listing.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
