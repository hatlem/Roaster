import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole, getOrganizationId } from "@/lib/api-utils";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// PUT /api/settings/organization - Update organization details
export async function PUT(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireRole(["ADMIN"]);
    const orgId = await getOrganizationId(session.user.id);

    const body = await request.json();
    const { name, orgNumber, contactEmail, address } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return errorResponse("Organization name is required");
    }

    if (!orgNumber || !orgNumber.trim()) {
      return errorResponse("Organization number is required");
    }

    if (!contactEmail || !contactEmail.trim()) {
      return errorResponse("Contact email is required");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return errorResponse("Invalid email format");
    }

    // Check that org number is not taken by another organization
    const existingOrg = await prisma.organization.findUnique({
      where: { orgNumber: orgNumber.trim() },
      select: { id: true },
    });

    if (existingOrg && existingOrg.id !== orgId) {
      return errorResponse("Organization number is already in use");
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: name.trim(),
        orgNumber: orgNumber.trim(),
        contactEmail: contactEmail.trim(),
        address: address?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        orgNumber: true,
        contactEmail: true,
        address: true,
      },
    });

    return successResponse(updated);
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
    console.error("Error updating organization:", error);
    return errorResponse("Failed to update organization settings", 500);
  }
}
