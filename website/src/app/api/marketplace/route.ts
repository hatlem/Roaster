import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getAvailableListings,
  createListing,
} from "@/services/marketplaceService";
import { MarketplaceMode } from "@prisma/client";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { audit } from "@/lib/audit";

const createListingSchema = z.object({
  shiftId: z.string().min(1, "Shift ID is required"),
  mode: z.enum(["SWAP", "HANDOVER", "SELL"]),
  reason: z.string().optional(),
  availableUntil: z.string().optional(),
  targetEmployeeId: z.string().optional(),
  eligibleRoles: z.array(z.string()).optional(),
  eligibleUserIds: z.array(z.string()).optional(),
});

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
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || dict.api.marketplace.shiftIdRequired },
        { status: 400 }
      );
    }

    const {
      shiftId,
      mode,
      reason,
      availableUntil,
      targetEmployeeId,
      eligibleRoles,
      eligibleUserIds,
    } = parsed.data;

    // HANDOVER mode requires targetEmployeeId
    if (mode === "HANDOVER" && !targetEmployeeId) {
      return NextResponse.json(
        { error: dict.api.marketplace.targetEmployeeRequired },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

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

    audit.create(session.user.id, 'marketplace-listing', listing.id, { shiftId, mode }, user?.organizationId || undefined);

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : dict.api.marketplace.failedCreateListing },
      { status: 500 }
    );
  }
}
