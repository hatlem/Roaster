import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rejectListing } from "@/services/marketplaceService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only managers can reject shift transfers" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
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
      message: "Shift transfer rejected",
    });
  } catch (error) {
    console.error("Reject listing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reject transfer" },
      { status: 500 }
    );
  }
}
