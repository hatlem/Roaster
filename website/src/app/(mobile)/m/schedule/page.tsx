import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getWeeklyShifts(userId: string) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23, 59, 59, 999);

  try {
    return await prisma.shift.findMany({
      where: {
        userId,
        startTime: { gte: startOfWeek, lte: endOfWeek },
      },
      include: {
        roster: {
          select: { name: true },
        },
      },
      orderBy: { startTime: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const shifts = await getWeeklyShifts(session.user.id);
  const today = new Date();

  // Generate week days
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  // Group shifts by date
  const shiftsByDate = shifts.reduce(
    (acc, shift) => {
      const dateKey = new Date(shift.startTime).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(shift);
      return acc;
    },
    {} as Record<string, typeof shifts>
  );

  // Calculate weekly hours
  const totalHours = shifts.reduce((sum, shift) => {
    const start = new Date(shift.startTime);
    const end = new Date(shift.endTime);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  return (
    <div className="p-4">
      {/* Week Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl mb-1">My Schedule</h1>
        <p className="text-ink/60 text-sm">
          Week of{" "}
          {startOfWeek.toLocaleDateString("en-GB", {
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Week Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-stone/30">
          <p className="text-2xl font-display text-ocean">{shifts.length}</p>
          <p className="text-xs text-ink/60">Shifts this week</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone/30">
          <p className="text-2xl font-display text-forest">
            {totalHours.toFixed(1)}h
          </p>
          <p className="text-xs text-ink/60">Hours scheduled</p>
        </div>
      </div>

      {/* Week View */}
      <div className="space-y-4">
        {weekDays.map((date) => {
          const dateKey = date.toDateString();
          const dayShifts = shiftsByDate[dateKey] || [];
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < today && !isToday;

          return (
            <div
              key={dateKey}
              className={`rounded-xl overflow-hidden ${
                isToday
                  ? "border-2 border-ocean"
                  : isPast
                    ? "opacity-60"
                    : "border border-stone/30"
              }`}
            >
              {/* Day Header */}
              <div
                className={`px-4 py-2 ${
                  isToday ? "bg-ocean text-white" : "bg-cream"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {date.toLocaleDateString("en-GB", { weekday: "long" })}
                    {isToday && <span className="ml-2 text-xs">Today</span>}
                  </span>
                  <span className="text-sm opacity-80">
                    {date.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>

              {/* Shifts */}
              <div className="bg-white">
                {dayShifts.length === 0 ? (
                  <p className="px-4 py-3 text-ink/40 text-sm">No shifts</p>
                ) : (
                  dayShifts.map((shift) => {
                    const start = new Date(shift.startTime);
                    const end = new Date(shift.endTime);
                    const duration =
                      (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                    return (
                      <div
                        key={shift.id}
                        className="px-4 py-3 border-t border-stone/20 flex items-center"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {start.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {end.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs text-ink/60">
                            {duration.toFixed(1)} hours
                          </p>
                        </div>
                        {shift.isOvertime && (
                          <span className="text-xs bg-gold/10 text-gold px-2 py-1 rounded-full">
                            OT
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
