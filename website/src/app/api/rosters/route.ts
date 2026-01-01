import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireAuth, requireRole } from "@/lib/api-utils";

// GET /api/rosters - List rosters
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const locationId = searchParams.get("locationId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Record<string, unknown> = {};

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
      return errorResponse("Unauthorized", 401);
    }
    console.error("Error fetching rosters:", error);
    return errorResponse("Failed to fetch rosters", 500);
  }
}

// POST /api/rosters - Create roster
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);

    const body = await request.json();
    const { name, startDate, endDate, locationId } = body;

    if (!name || !startDate || !endDate) {
      return errorResponse("Missing required fields: name, startDate, endDate");
    }

    // Get or create default organization
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: "Default Organization",
          orgNumber: "000000000",
          contactEmail: "admin@example.no",
        },
      });
    }

    const roster = await prisma.roster.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        organizationId: organization.id,
        locationId,
        createdBy: session.user?.email || "system",
        status: "DRAFT",
      },
      include: {
        location: true,
      },
    });

    return successResponse(roster, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }
    console.error("Error creating roster:", error);
    return errorResponse("Failed to create roster", 500);
  }
}
