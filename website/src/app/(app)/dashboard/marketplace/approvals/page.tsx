import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApprovalActions } from "@/components/marketplace/ApprovalActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shift Transfer Approvals",
};

async function getPendingApprovals(organizationId: string) {
  try {
    return await prisma.shiftMarketplaceListing.findMany({
      where: {
        status: "CLAIMED",
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
        claimedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { claimedAt: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function ApprovalsPage() {
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

  // Only managers can access this page
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    redirect("/dashboard/marketplace");
  }

  const pendingApprovals = await getPendingApprovals(user.organizationId);

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
        <h1 className="font-display text-4xl mb-2">Shift Transfer Approvals</h1>
        <p className="text-ink/60">Review and approve shift transfer requests</p>
      </div>

      {/* Info Box */}
      <div className="bg-ocean/5 rounded-2xl p-6 border border-ocean/20 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-info-circle text-ocean" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Approval Guidelines</h3>
            <p className="text-ink/60 text-sm">
              When approving a shift transfer, the shift will be reassigned to the
              new employee. Both employees will be notified of the decision.
              Consider compliance implications before approving.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone/50 text-center">
          <i className="fas fa-check-circle text-4xl mb-4 text-forest" />
          <p className="text-lg font-medium mb-2">All caught up!</p>
          <p className="text-ink/60">No pending shift transfers to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((listing) => {
            const shift = listing.shift;
            const startTime = new Date(shift.startTime);
            const endTime = new Date(shift.endTime);
            const duration =
              (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl p-6 border border-stone/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Shift Info */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gold/10 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-gold">
                          {startTime.toLocaleDateString("en-GB", { day: "numeric" })}
                        </span>
                        <span className="text-xs text-gold">
                          {startTime.toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {startTime.toLocaleDateString("en-GB", {
                            weekday: "long",
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
                    </div>

                    {/* Transfer Details */}
                    <div className="flex items-center gap-4 mb-4">
                      {/* From */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-terracotta/10 rounded-full flex items-center justify-center">
                          <span className="text-terracotta text-xs font-semibold">
                            {shift.user?.firstName[0]}
                            {shift.user?.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-ink/60">From</p>
                          <p className="text-sm font-medium">
                            {shift.user?.firstName} {shift.user?.lastName}
                          </p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <i className="fas fa-arrow-right text-ink/30" />

                      {/* To */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-forest/10 rounded-full flex items-center justify-center">
                          <span className="text-forest text-xs font-semibold">
                            {listing.claimedByUser?.firstName[0]}
                            {listing.claimedByUser?.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-ink/60">To</p>
                          <p className="text-sm font-medium">
                            {listing.claimedByUser?.firstName}{" "}
                            {listing.claimedByUser?.lastName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-ink/60">
                      <span>
                        <i className="fas fa-calendar mr-1" />
                        Roster: {shift.roster?.name}
                      </span>
                      <span>
                        <i className="fas fa-clock mr-1" />
                        Claimed:{" "}
                        {listing.claimedAt
                          ? new Date(listing.claimedAt).toLocaleDateString("en-GB")
                          : "-"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${
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

                    {/* Reason */}
                    {listing.reason && (
                      <p className="mt-3 text-sm text-ink/60 italic">
                        &quot;{listing.reason}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-6">
                    <ApprovalActions listingId={listing.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
