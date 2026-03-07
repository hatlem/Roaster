import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claimListing } from "@/services/marketplaceService";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: dict.api.common.unauthorized }, { status: 401 });
    }

    const { id } = await params;

    const listing = await claimListing({
      listingId: id,
      claimedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      listing,
      message: dict.api.marketplace.shiftClaimed,
    });
  } catch (error) {
    console.error("Claim listing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : dict.api.marketplace.failedClaimShift },
      { status: 500 }
    );
  }
}
