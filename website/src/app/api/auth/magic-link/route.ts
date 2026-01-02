import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { sendMagicLinkEmail } from "@/lib/email";
import { randomBytes } from "crypto";

// POST /api/auth/magic-link - Request magic link for login
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return errorResponse("Email is required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success message for security (don't reveal if user exists)
    const successMessage = "If an account exists with this email, a magic link has been sent.";

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
    return errorResponse("Failed to send magic link", 500);
  }
}
