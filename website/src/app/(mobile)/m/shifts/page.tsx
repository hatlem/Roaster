import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ClaimButton } from "@/components/marketplace/ClaimButton";

export const dynamic = "force-dynamic";

async function getAvailableShifts(organizationId: string, userId: string) {
  try {
    return await prisma.shiftMarketplaceListing.findMany({
      where: {
        status: "AVAILABLE",
        availableUntil: { gt: new Date() },
        postedBy: { not: userId },
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
          },
        },
      },
      orderBy: { postedAt: "desc" },
      take: 20,
    });
  } catch {
    return [];
  }
}

export default async function ShiftsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    redirect("/login");
  }

  const listings = await getAvailableShifts(user.organizationId, session.user.id);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl">Available Shifts</h1>
        <p className="text-ink/60 text-sm">Claim shifts from coworkers</p>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-stone/30 text-center">
          <i className="fas fa-exchange-alt text-3xl mb-3 text-stone" />
          <p className="text-ink/60">No shifts available</p>
          <p className="text-sm text-ink/40 mt-1">
            Check back later for new opportunities
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const shift = listing.shift;
            const startTime = new Date(shift.startTime);
            const endTime = new Date(shift.endTime);
            const duration =
              (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            return (
              <div
                key={listing.id}
                className="bg-white rounded-xl p-4 border border-stone/30"
              >
                {/* Date & Time */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-ocean/10 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-ocean">
                      {startTime.getDate()}
                    </span>
                    <span className="text-xs text-ocean">
                      {startTime.toLocaleDateString("en-GB", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {startTime.toLocaleDateString("en-GB", { weekday: "long" })}
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
                      <span className="ml-2">({duration.toFixed(1)}h)</span>
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      listing.mode === "SELL"
                        ? "bg-forest/10 text-forest"
                        : listing.mode === "SWAP"
                          ? "bg-ocean/10 text-ocean"
                          : "bg-gold/10 text-gold"
                    }`}
                  >
                    {listing.mode}
                  </span>
                </div>

                {/* Posted By */}
                <div className="flex items-center gap-2 mb-3 text-sm text-ink/60">
                  <div className="w-6 h-6 bg-stone/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {shift.user?.firstName[0]}
                      {shift.user?.lastName[0]}
                    </span>
                  </div>
                  <span>
                    {shift.user?.firstName} {shift.user?.lastName}
                  </span>
                </div>

                {/* Reason */}
                {listing.reason && (
                  <p className="text-sm text-ink/60 italic mb-3">
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
