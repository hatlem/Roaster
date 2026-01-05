import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get user's schedule for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    // Default to current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    const start = startStr ? new Date(startStr) : startOfWeek;
    const end = endStr ? new Date(endStr) : endOfWeek;

    const shifts = await prisma.shift.findMany({
      where: {
        userId: session.user.id,
        startTime: { gte: start, lte: end },
      },
      include: {
        roster: {
          select: { name: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Calculate total hours
    const totalHours = shifts.reduce((sum, shift) => {
      const duration =
        (new Date(shift.endTime).getTime() -
          new Date(shift.startTime).getTime()) /
        (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    return NextResponse.json({
      shifts,
      totalHours,
      shiftCount: shifts.length,
    });
  } catch (error) {
    console.error("Get schedule error:", error);
    return NextResponse.json(
      { error: "Failed to get schedule" },
      { status: 500 }
    );
  }
}
