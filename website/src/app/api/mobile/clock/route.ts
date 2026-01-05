import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Get current clock status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's active clock-in (no clock-out yet)
    const activeClockIn = await prisma.actualHours.findFirst({
      where: {
        userId: session.user.id,
        date: { gte: today },
        clockOut: null,
      },
      orderBy: { clockIn: "desc" },
    });

    // Get today's total hours
    const todayHours = await prisma.actualHours.findMany({
      where: {
        userId: session.user.id,
        date: { gte: today },
        clockOut: { not: null },
      },
    });

    const totalHours = todayHours.reduce((sum, h) => sum + h.totalHours, 0);
    const currentHours = activeClockIn
      ? (Date.now() - new Date(activeClockIn.clockIn).getTime()) / (1000 * 60 * 60)
      : 0;

    return NextResponse.json({
      isClockedIn: !!activeClockIn,
      clockInTime: activeClockIn?.clockIn.toISOString() || null,
      todayHours: totalHours + currentHours,
    });
  } catch (error) {
    console.error("Get clock status error:", error);
    return NextResponse.json(
      { error: "Failed to get clock status" },
      { status: 500 }
    );
  }
}

// Clock in/out
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, latitude, longitude, accuracy } = body;

    if (!["clock_in", "clock_out"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be clock_in or clock_out" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's location for geofence validation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { location: true },
    });

    // Validate geofence if required
    let isGeofenceValid = true;
    if (user?.location?.requireGeofence && latitude && longitude) {
      const locLat = user.location.geofenceLatitude;
      const locLng = user.location.geofenceLongitude;
      const radius = user.location.geofenceRadius;

      if (locLat && locLng) {
        const distance = calculateDistance(latitude, longitude, locLat, locLng);
        isGeofenceValid = distance <= radius;

        if (!isGeofenceValid) {
          return NextResponse.json(
            {
              error: `You are ${Math.round(distance)}m from the work location. Must be within ${radius}m to clock in.`,
            },
            { status: 400 }
          );
        }
      }
    }

    if (action === "clock_in") {
      // Check if already clocked in
      const activeClockIn = await prisma.actualHours.findFirst({
        where: {
          userId: session.user.id,
          date: { gte: today },
          clockOut: null,
        },
      });

      if (activeClockIn) {
        return NextResponse.json(
          { error: "Already clocked in" },
          { status: 400 }
        );
      }

      // Create new clock-in record
      await prisma.actualHours.create({
        data: {
          userId: session.user.id,
          date: new Date(),
          clockIn: new Date(),
          totalHours: 0,
          clockInLatitude: latitude,
          clockInLongitude: longitude,
          clockInAccuracy: accuracy,
          isGeofenceValid,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Clocked in successfully",
      });
    } else {
      // Clock out
      const activeClockIn = await prisma.actualHours.findFirst({
        where: {
          userId: session.user.id,
          date: { gte: today },
          clockOut: null,
        },
      });

      if (!activeClockIn) {
        return NextResponse.json(
          { error: "Not clocked in" },
          { status: 400 }
        );
      }

      const clockOut = new Date();
      const totalHours =
        (clockOut.getTime() - new Date(activeClockIn.clockIn).getTime()) /
        (1000 * 60 * 60);

      // Update record with clock-out
      await prisma.actualHours.update({
        where: { id: activeClockIn.id },
        data: {
          clockOut,
          totalHours,
          clockOutLatitude: latitude,
          clockOutLongitude: longitude,
          clockOutAccuracy: accuracy,
          isGeofenceValid: isGeofenceValid && activeClockIn.isGeofenceValid,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Clocked out successfully",
        totalHours,
      });
    }
  } catch (error) {
    console.error("Clock action error:", error);
    return NextResponse.json(
      { error: "Failed to process clock action" },
      { status: 500 }
    );
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
