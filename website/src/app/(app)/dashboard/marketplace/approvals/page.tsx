import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApprovalActions } from "@/components/marketplace/ApprovalActions";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.marketplace.approvalsTitle };
}

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
              select: { id: true, firstName: true, lastName: true },
            },
            roster: {
              select: { id: true, name: true },
            },
          },
        },
        claimedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
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

  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    redirect("/dashboard/marketplace");
  }

  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.marketplace;
  const cd = dict.dashboard.components;

  const pendingApprovals = await getPendingApprovals(user.organizationId);

  return (
    <div className="p-8">
      {/* Header with warm-orb */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="warm-orb w-[400px] h-[400px] -top-48 -right-32"
          style={{ background: "radial-gradient(circle, var(--forest), transparent)", opacity: 0.07 }}
        />
        <div className="relative">
          <Link
            href="/dashboard/marketplace"
            className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4 animate-fade-up"
          >
            <i className="fas fa-arrow-left" />
            {d.backToMarketplace}
          </Link>
          <p className="text-forest mb-3 tracking-widest uppercase text-xs font-semibold animate-fade-up delay-1">
            {d.approvalsTitle}
          </p>
          <h1 className="font-display text-4xl md:text-5xl mb-3 animate-fade-up delay-2">{d.approvalsTitle}</h1>
          <p className="text-ink/60 text-lg animate-fade-up delay-3">{d.approvalsSubtitle}</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="relative bg-cream/50 rounded-2xl p-6 border border-stone/50 mb-8 overflow-hidden animate-fade-up delay-3">
        <div className="accent-line absolute top-0 left-0 right-0" />
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-info-circle text-ocean" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">{d.approvalGuidelinesTitle}</h3>
            <p className="text-ink/60 text-sm">
              {d.approvalGuidelinesDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length === 0 ? (
        <div className="relative bg-forest/5 rounded-2xl p-16 border border-forest/20 text-center overflow-hidden animate-fade-up delay-4">
          {/* Decorative dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-2 h-2 rounded-full bg-forest/20 top-6 left-[15%]" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-gold/30 top-10 left-[30%]" />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-forest/15 top-4 right-[25%]" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-ocean/20 top-8 right-[10%]" />
            <div className="absolute w-2 h-2 rounded-full bg-terracotta/15 top-12 left-[50%]" />
            <div className="absolute w-1 h-1 rounded-full bg-forest/25 top-5 left-[70%]" />
            <div className="absolute w-2 h-2 rounded-full bg-gold/20 top-14 right-[40%]" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-forest/20 top-3 left-[85%]" />
          </div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-forest/10 flex items-center justify-center">
              <i className="fas fa-check-circle text-4xl text-forest" />
            </div>
            <p className="text-xl font-display mb-2 text-forest">{d.allCaughtUp}</p>
            <p className="text-ink/60">{d.noPendingTransfers}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {pendingApprovals.map((listing, index) => {
            const shift = listing.shift;
            const startTime = new Date(shift.startTime);
            const endTime = new Date(shift.endTime);
            const duration =
              (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            const delayClass = index <= 5 ? `delay-${Math.min(index + 1, 6)}` : "delay-6";

            return (
              <div
                key={listing.id}
                className={`bg-white rounded-2xl p-6 border border-stone/50 card-hover animate-fade-up ${delayClass}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Shift Info */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-terracotta/10 rounded-2xl flex flex-col items-center justify-center border border-gold/20">
                        <span className="text-lg font-bold text-gold">
                          {startTime.toLocaleDateString(locale, { day: "numeric" })}
                        </span>
                        <span className="text-xs font-medium text-gold/80 uppercase">
                          {startTime.toLocaleDateString(locale, { month: "short" })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {startTime.toLocaleDateString(locale, {
                            weekday: "long",
                          })}
                        </p>
                        <p className="text-ink/60">
                          {startTime.toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {endTime.toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <span className="ml-2">({duration.toFixed(1)}h)</span>
                        </p>
                      </div>
                    </div>

                    {/* Transfer Details */}
                    <div className="flex items-center gap-2 mb-5">
                      {/* From */}
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-terracotta/30 bg-terracotta/10">
                          <span className="text-terracotta text-xs font-semibold">
                            {shift.user?.firstName[0]}
                            {shift.user?.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-ink/40 uppercase tracking-wide font-medium">{d.from}</p>
                          <p className="text-sm font-medium">
                            {shift.user?.firstName} {shift.user?.lastName}
                          </p>
                        </div>
                      </div>

                      {/* Gradient line */}
                      <div className="flex-1 mx-3 flex items-center">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-terracotta/40 via-gold/30 to-forest/40 rounded-full" />
                        <i className="fas fa-chevron-right text-forest/40 text-xs mx-1" />
                      </div>

                      {/* To */}
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-forest/30 bg-forest/10">
                          <span className="text-forest text-xs font-semibold">
                            {listing.claimedByUser?.firstName[0]}
                            {listing.claimedByUser?.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-ink/40 uppercase tracking-wide font-medium">{d.toLabel}</p>
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
                        {d.rosterColon} {shift.roster?.name}
                      </span>
                      <span>
                        <i className="fas fa-clock mr-1" />
                        {d.claimedColon}{" "}
                        {listing.claimedAt
                          ? new Date(listing.claimedAt).toLocaleDateString(locale)
                          : "-"}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full font-semibold ${
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
                      <div className="mt-4">
                        <span className="font-display text-2xl text-terracotta/60 leading-none">&ldquo;</span>
                        <p className="text-sm text-ink/60 italic -mt-2 pl-4">
                          {listing.reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-6">
                    <ApprovalActions listingId={listing.id} dictionary={cd.approvalActions} />
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
