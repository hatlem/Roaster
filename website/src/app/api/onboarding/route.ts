import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { sendWelcomeEmail } from "@/lib/email";
import { enrollInOnboardingAsync } from "@/lib/services/email-onboarding";
import { checkRateLimit } from "@/lib/rate-limit";
import { randomBytes } from "crypto";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// POST /api/onboarding - Create new account with organization
export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, resetIn } = checkRateLimit(`onboarding:${ip}`, 3, 60 * 60 * 1000);
    if (!allowed) {
      return errorResponse(dict.api.common.tooManyRequests.replace('{seconds}', String(Math.ceil(resetIn / 1000))), 429);
    }

    const { email } = await request.json();

    if (!email) {
      return errorResponse(dict.api.auth.emailRequired);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(dict.api.onboarding.invalidEmailFormat);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse(dict.api.onboarding.emailAlreadyExists, 409);
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

    const emailLocalPart = email.split("@")[0];
    const nameParts = emailLocalPart.split(/[._-]/).filter(Boolean);
    const extractedFirstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase() : "";
    const extractedLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].slice(1).toLowerCase() : "";

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: extractedFirstName,
        lastName: extractedLastName,
        role: "ADMIN",
        organizationId: organization.id,
        magicLinkToken,
        magicLinkExpires,
      },
    });

    // Enroll in GetMailer onboarding sequence (fire-and-forget)
    enrollInOnboardingAsync({
      email: email.toLowerCase(),
      metadata: { userId: user.id },
    })

    // Send welcome email with magic link
    await sendWelcomeEmail(email.toLowerCase(), magicLinkToken);

    console.log(`[ONBOARDING] Created account for ${email}`);
    console.log(`[ONBOARDING] Organization: ${organization.id}`);
    console.log(`[ONBOARDING] User: ${user.id}`);

    return successResponse(
      {
        userId: user.id,
        organizationId: organization.id,
      },
      201
    );
  } catch (error) {
    console.error("Error in onboarding:", error);
    return errorResponse(dict.api.onboarding.failedCreateAccount, 500);
  }
}
