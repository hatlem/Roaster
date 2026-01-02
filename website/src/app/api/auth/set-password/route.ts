import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";
import { hash } from "bcrypt";

// POST /api/auth/set-password - Set password for authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { password } = await request.json();

    if (!password) {
      return errorResponse("Password is required");
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters");
    }

    // Hash the password
    const passwordHash = await hash(password, 12);

    // Update user with new password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    console.log(`[SET_PASSWORD] Password set for user ${session.user.id}`);

    return successResponse({ message: "Password set successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    console.error("Error setting password:", error);
    return errorResponse("Failed to set password", 500);
  }
}
