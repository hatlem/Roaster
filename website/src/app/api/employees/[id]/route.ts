import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole, getOrganizationId } from "@/lib/api-utils";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/employees/[id] - Get single employee
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);
    const { id } = await params;

    const employee = await prisma.user.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        department: true,
        position: true,
        employeeNumber: true,
        hourlyRate: true,
        hireDate: true,
        isActive: true,
        locationId: true,
        location: { select: { name: true } },
        createdAt: true,
      },
    });

    if (!employee) {
      return errorResponse(dict.api.employees.employeeNotFound, 404);
    }

    return successResponse(employee);
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
    console.error("Error fetching employee:", error);
    return errorResponse(dict.api.employees.failedFetchEmployees, 500);
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    const orgId = await getOrganizationId(session.user.id);
    const { id } = await params;

    // Verify employee belongs to org
    const existing = await prisma.user.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      return errorResponse(dict.api.employees.employeeNotFound, 404);
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      role,
      department,
      position,
      employeeNumber,
      hourlyRate,
    } = body;

    if (!email || !firstName || !lastName) {
      return errorResponse(dict.api.employees.missingRequiredFields);
    }

    // Validate role
    const validRoles = ["ADMIN", "MANAGER", "REPRESENTATIVE", "EMPLOYEE"];
    if (role && !validRoles.includes(role)) {
      return errorResponse(dict.api.employees.invalidRole);
    }

    // Managers cannot promote to admin
    if (session.user.role === "MANAGER" && role === "ADMIN") {
      return errorResponse(dict.api.employees.managersCannotPromoteToAdmin, 403);
    }

    // Check email uniqueness (exclude current user)
    if (email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return errorResponse(dict.api.employees.emailAlreadyExists);
      }
    }

    // Check employeeNumber uniqueness (exclude current user)
    if (employeeNumber && employeeNumber !== existing.employeeNumber) {
      const numberTaken = await prisma.user.findFirst({
        where: { employeeNumber, id: { not: id } },
      });
      if (numberTaken) {
        return errorResponse(dict.api.employees.employeeNumberExists);
      }
    }

    const employee = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || null,
        role: role || existing.role,
        department: department || null,
        position: position || null,
        employeeNumber: employeeNumber || null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        department: true,
        position: true,
        employeeNumber: true,
        hourlyRate: true,
        isActive: true,
        createdAt: true,
      },
    });

    return successResponse(employee);
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
    console.error("Error updating employee:", error);
    return errorResponse(dict.api.employees.failedUpdateEmployee, 500);
  }
}
