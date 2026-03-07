import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { sendMagicLinkEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { randomBytes } from "crypto";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// POST /api/auth/magic-link - Request magic link for login
export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, resetIn } = checkRateLimit(`magic-link:${ip}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return errorResponse(dict.api.common.tooManyRequests.replace('{seconds}', String(Math.ceil(resetIn / 1000))), 429);
    }

    const { email } = await request.json();

    if (!email) {
      return errorResponse(dict.api.auth.emailRequired);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success message for security (don't reveal if user exists)
    const successMessage = dict.api.auth.magicLinkSent;

    if (!user || !user.isActive) {
      // Don't reveal that user doesn't exist
      console.log(`[MAGIC_LINK] No user found for ${email}`);
      return successResponse({ message: successMessage });
    }

    // Generate new magic link token (1 hour expiry)
    const magicLinkToken = randomBytes(32).toString("hex");
    const magicLinkExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { magicLinkToken, magicLinkExpires },
    });

    // Send magic link email
    await sendMagicLinkEmail(email.toLowerCase(), magicLinkToken);

    console.log(`[MAGIC_LINK] Sent magic link to ${email}`);

    return successResponse({ message: successMessage });
  } catch (error) {
    console.error("Error generating magic link:", error);
    return errorResponse(dict.api.auth.failedSendMagicLink, 500);
  }
}
