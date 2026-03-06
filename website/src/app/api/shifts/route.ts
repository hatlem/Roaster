import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireAuth, requireRole, getOrganizationId } from "@/lib/api-utils";

// GET /api/shifts - List shifts
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const orgId = await getOrganizationId(session.user.id);

    const { searchParams } = new URL(request.url);
    const rosterId = searchParams.get("rosterId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {
      roster: { organizationId: orgId },
    };

    if (rosterId) {
      where.rosterId = rosterId;
    }

    // Employees can only see their own shifts
    if (session.user.role === "EMPLOYEE") {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
        roster: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return successResponse(shifts);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse("No organization found", 400);
    }
    console.error("Error fetching shifts:", error);
    return errorResponse("Failed to fetch shifts", 500);
  }
}

// POST /api/shifts - Create shift
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const body = await request.json();
    const {
      rosterId,
      userId,
      startTime,
      endTime,
      breakMinutes = 0,
      department,
      location,
      notes,
    } = body;

    if (!rosterId || !userId || !startTime || !endTime) {
      return errorResponse("Missing required fields");
    }

    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      select: { organizationId: true },
    });
    if (!roster || roster.organizationId !== orgId) {
      return errorResponse("Roster not found", 404);
    }

    // Get user's hourly rate for labor cost calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hourlyRate: true },
    });

    // Calculate hours and labor cost
    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalMinutes = (end.getTime() - start.getTime()) / 1000 / 60 - breakMinutes;
    const totalHours = totalMinutes / 60;
    const laborCost = user?.hourlyRate ? Number(user.hourlyRate) * totalHours : null;

    const shift = await prisma.shift.create({
      data: {
        rosterId,
        userId,
        startTime: start,
        endTime: end,
        breakMinutes,
        department,
        location,
        notes,
        hourlyRate: user?.hourlyRate,
        laborCost,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return successResponse(shift, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse("No organization found", 400);
    }
    console.error("Error creating shift:", error);
    return errorResponse("Failed to create shift", 500);
  }
}
