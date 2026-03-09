/**
 * GDPR Data Deletion (ISO 27001 A.5.34 / GDPR Art. 17)
 * Permanently deletes all personal data for the authenticated user.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body.confirm) {
    return NextResponse.json(
      { error: 'Must confirm with { "confirm": true }' },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { email: session.user.email } });

  return NextResponse.json({
    deleted: true,
    message: "Your data has been permanently deleted.",
  });
}
