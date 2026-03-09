import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireAuth, requireRole, getOrganizationId } from "@/lib/api-utils";
import { checkEmployeeLimit } from "@/lib/tier-gating";
import { hash } from "bcrypt";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { audit } from "@/lib/audit";

// GET /api/employees - List employees
export async function GET(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const department = searchParams.get("department");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = { organizationId: orgId };

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
      return errorResponse(dict.api.common.unauthorized, 401);
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse(dict.api.common.forbidden, 403);
    }
    if (error instanceof Error && error.message === "NoOrganization") {
      return errorResponse(dict.api.common.noOrganization, 400);
    }
    console.error("Error fetching employees:", error);
    return errorResponse(dict.api.employees.failedFetchEmployees, 500);
  }
}

// POST /api/employees - Create employee
export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);

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
      return errorResponse(dict.api.employees.missingRequiredFields);
    }

    // Check employee limit for current tier
    const employeeLimitCheck = await checkEmployeeLimit(orgId);
    if (!employeeLimitCheck.allowed) {
      return errorResponse(dict.dashboard.components.billing.tierLimited, 403);
    }

    // Validate role is a valid enum value
    const validRoles = ["ADMIN", "MANAGER", "REPRESENTATIVE", "EMPLOYEE"];
    if (!validRoles.includes(role)) {
      return errorResponse(dict.api.employees.invalidRole);
    }

    // Managers cannot create admins
    if (session.user.role === "MANAGER" && role === "ADMIN") {
      return errorResponse(dict.api.employees.managersCannotCreateAdmin, 403);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(dict.api.employees.emailAlreadyExists);
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
        organizationId: orgId,
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

    audit.create(session.user.id, 'employee', employee.id, { email, role }, orgId);

    return successResponse({ ...employee, temporaryPassword: password ? undefined : tempPassword }, 201);
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
    if (error instanceof Error && error.message === "TierLimited") {
      return errorResponse(dict.dashboard.components.billing.tierLimited, 403);
    }
    console.error("Error creating employee:", error);
    return errorResponse(dict.api.employees.failedCreateEmployee, 500);
  }
}
