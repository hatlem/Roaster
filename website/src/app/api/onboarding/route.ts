import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { sendWelcomeEmail } from "@/lib/email";
import { randomBytes } from "crypto";

// POST /api/onboarding - Create new account with organization
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return errorResponse("Email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("Invalid email format");
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse("An account with this email already exists. Please sign in instead.", 409);
    }

    // Generate magic link token (24 hours for initial signup)
    const magicLinkToken = randomBytes(32).toString("hex");
    const magicLinkExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Extract domain from email for organization name
    const emailDomain = email.split("@")[1];
    const orgName = emailDomain
      .split(".")[0]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: `${orgName} Organization`,
        orgNumber: `TRIAL-${Date.now().toString(36).toUpperCase()}`,
        contactEmail: email.toLowerCase(),
      },
    });

    // Create admin user (no password - will use magic link)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: "",
        lastName: "",
        role: "ADMIN",
        organizationId: organization.id,
        magicLinkToken,
        magicLinkExpires,
      },
    });

    // Send welcome email with magic link
    await sendWelcomeEmail(email.toLowerCase(), magicLinkToken);

    console.log(`[ONBOARDING] Created account for ${email}`);
    console.log(`[ONBOARDING] Organization: ${organization.id}`);
    console.log(`[ONBOARDING] User: ${user.id}`);

    return successResponse(
      {
        userId: user.id,
        organizationId: organization.id,
        magicLinkToken, // Return for auto-sign-in on same session
      },
      201
    );
  } catch (error) {
    console.error("Error in onboarding:", error);
    return errorResponse("Failed to create account", 500);
  }
}
