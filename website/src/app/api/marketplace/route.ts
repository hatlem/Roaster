import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getAvailableListings,
  createListing,
} from "@/services/marketplaceService";
import { MarketplaceMode } from "@prisma/client";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function GET(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: dict.api.common.unauthorized }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: dict.api.marketplace.noOrganization }, { status: 400 });
    }

    const listings = await getAvailableListings(user.organizationId);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Get listings error:", error);
    return NextResponse.json(
      { error: dict.api.marketplace.failedGetListings },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: dict.api.common.unauthorized }, { status: 401 });
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
        { error: dict.api.marketplace.shiftIdRequired },
        { status: 400 }
      );
    }

    // Validate mode
    const validModes: MarketplaceMode[] = ["SWAP", "HANDOVER", "SELL"];
    if (!mode || !validModes.includes(mode)) {
      return NextResponse.json(
        { error: dict.api.marketplace.invalidMode },
        { status: 400 }
      );
    }

    // HANDOVER mode requires targetEmployeeId
    if (mode === "HANDOVER" && !targetEmployeeId) {
      return NextResponse.json(
        { error: dict.api.marketplace.targetEmployeeRequired },
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
      { error: error instanceof Error ? error.message : dict.api.marketplace.failedCreateListing },
      { status: 500 }
    );
  }
}
