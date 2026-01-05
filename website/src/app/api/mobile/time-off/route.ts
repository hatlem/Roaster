import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get user's time off requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.timeOffRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Get time off requests error:", error);
    return NextResponse.json(
      { error: "Failed to get time off requests" },
      { status: 500 }
    );
  }
}

// Create new time off request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, startDate, endDate, reason } = body;

    // Validate required fields
    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Type, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Calculate total days (excluding weekends optionally)
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1
    );

    // Get user's organization for manager notification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with an organization" },
        { status: 400 }
      );
    }

    // Create the request
    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        userId: session.user.id,
        type,
        startDate: start,
        endDate: end,
        totalDays,
        reason: reason || null,
        status: "PENDING",
      },
    });

    // Create notification for managers (find managers in the organization)
    const managers = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: { in: ["ADMIN", "MANAGER"] },
      },
      select: { id: true },
    });

    // Create notifications for each manager
    if (managers.length > 0) {
      await prisma.notification.createMany({
        data: managers.map((manager) => ({
          userId: manager.id,
          type: "TIME_OFF_REQUEST",
          title: "New Time Off Request",
          message: `${session.user.name || "An employee"} requested ${totalDays} day${totalDays !== 1 ? "s" : ""} off`,
          relatedEntityType: "TimeOffRequest",
          relatedEntityId: timeOffRequest.id,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      request: timeOffRequest,
    });
  } catch (error) {
    console.error("Create time off request error:", error);
    return NextResponse.json(
      { error: "Failed to create time off request" },
      { status: 500 }
    );
  }
}
