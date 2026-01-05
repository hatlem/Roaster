import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claimListing } from "@/services/marketplaceService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const listing = await claimListing({
      listingId: id,
      claimedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      listing,
      message: "Shift claimed! Waiting for manager approval.",
    });
  } catch (error) {
    console.error("Claim listing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to claim shift" },
      { status: 500 }
    );
  }
}
