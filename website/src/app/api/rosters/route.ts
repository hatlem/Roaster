import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireAuth, requireRole, getOrganizationId } from "@/lib/api-utils";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { audit } from "@/lib/audit";

// GET /api/rosters - List rosters
export async function GET(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireAuth();
    const orgId = await getOrganizationId(session.user.id);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const locationId = searchParams.get("locationId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Record<string, unknown> = { organizationId: orgId };

    if (status) {
      where.status = status;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    // Employees can only see published/active rosters
    if (session.user.role === "EMPLOYEE") {
      where.status = { in: ["PUBLISHED", "ACTIVE"] };
    }

    const [rosters, total] = await Promise.all([
      prisma.roster.findMany({
        where,
        include: {
          location: true,
          _count: {
            select: { shifts: true },
          },
        },
        orderBy: { startDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.roster.count({ where }),
    ]);

    return successResponse({
      rosters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse(dict.api.common.unauthorized, 401);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse(dict.api.common.noOrganization, 400);
    }
    console.error("Error fetching rosters:", error);
    return errorResponse(dict.api.rosters.failedFetchRosters, 500);
  }
}

// POST /api/rosters - Create roster
export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const body = await request.json();
    const { name, startDate, endDate, locationId } = body;

    if (!name || !startDate || !endDate) {
      return errorResponse(dict.api.rosters.missingRequiredFields);
    }

    const roster = await prisma.roster.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        organizationId: orgId,
        locationId,
        createdBy: session.user?.email || "system",
        status: "DRAFT",
      },
      include: {
        location: true,
      },
    });

    audit.create(session.user.id, 'roster', roster.id, { name }, orgId);

    return successResponse(roster, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse(dict.api.common.unauthorized, 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse(dict.api.common.forbidden, 403);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse(dict.api.common.noOrganization, 400);
    }
    console.error("Error creating roster:", error);
    return errorResponse(dict.api.rosters.failedCreateRoster, 500);
  }
}
