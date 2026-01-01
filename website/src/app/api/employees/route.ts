import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireAuth, requireRole } from "@/lib/api-utils";
import { hash } from "bcrypt";

// GET /api/employees - List employees
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const department = searchParams.get("department");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    if (locationId) {
      where.locationId = locationId;
    }

    if (department) {
      where.department = department;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          position: true,
          employeeNumber: true,
          isActive: true,
          locationId: true,
          location: {
            select: { name: true },
          },
          createdAt: true,
        },
        orderBy: { lastName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({
      employees,
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
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }
    console.error("Error fetching employees:", error);
    return errorResponse("Failed to fetch employees", 500);
  }
}

// POST /api/employees - Create employee
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      role = "EMPLOYEE",
      department,
      position,
      employeeNumber,
      locationId,
      hourlyRate,
      startDate,
    } = body;

    if (!email || !firstName || !lastName) {
      return errorResponse("Missing required fields: email, firstName, lastName");
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Email already exists");
    }

    // Generate temporary password if not provided
    const tempPassword = password || `Welcome${Date.now().toString(36)}!`;
    const passwordHash = await hash(tempPassword, 12);

    const employee = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        department,
        position,
        employeeNumber,
        locationId,
        hourlyRate,
        hireDate: startDate ? new Date(startDate) : new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        employeeNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    return successResponse({ ...employee, temporaryPassword: password ? undefined : tempPassword }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }
    console.error("Error creating employee:", error);
    return errorResponse("Failed to create employee", 500);
  }
}
