import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { hash } from "bcrypt";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// POST /api/auth/set-password - Set password for authenticated user
export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  try {
    const session = await requireAuth();

    const { allowed, resetIn } = checkRateLimit(`set-password:${session.user.id}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return errorResponse(dict.api.common.tooManyRequests.replace('{seconds}', String(Math.ceil(resetIn / 1000))), 429);
    }

    const { password } = await request.json();

    if (!password) {
      return errorResponse(dict.api.auth.passwordRequired);
    }

    if (password.length < 8) {
      return errorResponse(dict.api.auth.passwordMinLength);
    }

    // Hash the password
    const passwordHash = await hash(password, 12);

    // Update user with new password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    console.log(`[SET_PASSWORD] Password set for user ${session.user.id}`);

    return successResponse({ message: dict.api.auth.passwordSetSuccess });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse(dict.api.common.unauthorized, 401);
    }
    console.error("Error setting password:", error);
    return errorResponse(dict.api.auth.failedSetPassword, 500);
  }
}
