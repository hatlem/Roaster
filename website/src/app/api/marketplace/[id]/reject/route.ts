import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rejectListing } from "@/services/marketplaceService";
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

    // Check if user is a manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: dict.api.marketplace.onlyManagersReject },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: dict.api.marketplace.rejectionReasonRequired },
        { status: 400 }
      );
    }

    await rejectListing({
      listingId: id,
      rejectedBy: session.user.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: dict.api.marketplace.shiftTransferRejected,
    });
  } catch (error) {
    console.error("Reject listing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : dict.api.marketplace.failedRejectTransfer },
      { status: 500 }
    );
  }
}
