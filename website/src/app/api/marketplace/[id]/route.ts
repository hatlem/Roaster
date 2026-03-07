import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListing, cancelListing } from "@/services/marketplaceService";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function GET(
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
    const listing = await getListing(id);

    if (!listing) {
      return NextResponse.json({ error: dict.api.marketplace.listingNotFound }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("Get listing error:", error);
    return NextResponse.json(
      { error: dict.api.marketplace.failedGetListing },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await cancelListing(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel listing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : dict.api.marketplace.failedCancelListing },
      { status: 500 }
    );
  }
}
