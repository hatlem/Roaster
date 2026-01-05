import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getAvailableListings,
  createListing,
} from "@/services/marketplaceService";
import { MarketplaceMode } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const listings = await getAvailableListings(user.organizationId);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Get listings error:", error);
    return NextResponse.json(
      { error: "Failed to get listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      shiftId,
      mode,
      reason,
      availableUntil,
      targetEmployeeId,
      eligibleRoles,
      eligibleUserIds,
    } = body;

    if (!shiftId) {
      return NextResponse.json(
        { error: "shiftId is required" },
        { status: 400 }
      );
    }

    // Validate mode
    const validModes: MarketplaceMode[] = ["SWAP", "HANDOVER", "SELL"];
    if (!mode || !validModes.includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be one of: SWAP, HANDOVER, SELL" },
        { status: 400 }
      );
    }

    // HANDOVER mode requires targetEmployeeId
    if (mode === "HANDOVER" && !targetEmployeeId) {
      return NextResponse.json(
        { error: "targetEmployeeId is required for HANDOVER mode" },
        { status: 400 }
      );
    }

    const listing = await createListing({
      shiftId,
      postedBy: session.user.id,
      mode: mode as MarketplaceMode,
      reason,
      availableUntil: availableUntil
        ? new Date(availableUntil)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      targetEmployeeId,
      eligibleRoles,
      eligibleUserIds,
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create listing" },
      { status: 500 }
    );
  }
}
