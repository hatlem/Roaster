import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireRole, getOrganizationId } from "@/lib/api-utils";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { audit } from "@/lib/audit";

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
      return errorResponse(dict.api.settings.organization.nameRequired);
    }

    if (!orgNumber || !orgNumber.trim()) {
      return errorResponse(dict.api.settings.organization.orgNumberRequired);
    }

    if (!contactEmail || !contactEmail.trim()) {
      return errorResponse(dict.api.settings.organization.contactEmailRequired);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return errorResponse(dict.api.settings.organization.invalidEmailFormat);
    }

    // Check that org number is not taken by another organization
    const existingOrg = await prisma.organization.findUnique({
      where: { orgNumber: orgNumber.trim() },
      select: { id: true },
    });

    if (existingOrg && existingOrg.id !== orgId) {
      return errorResponse(dict.api.settings.organization.orgNumberInUse);
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

    audit.update(session.user.id, 'organization', orgId, { name }, orgId);

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
    return errorResponse(dict.api.settings.organization.failedUpdate, 500);
  }
}
