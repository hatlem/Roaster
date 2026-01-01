import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rosters",
};

async function getRosters() {
  try {
    const rosters = await prisma.roster.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { shifts: true },
        },
      },
    });
    return rosters;
  } catch {
    return [];
  }
}

export default async function RostersPage() {
  const rosters = await getRosters();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-2">Rosters</h1>
          <p className="text-ink/60">Manage your work schedules</p>
        </div>
        <Link
          href="/dashboard/rosters/new"
          className="bg-ocean text-white px-6 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus" />
          Create Roster
        </Link>
      </div>

      {rosters.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone/50 text-center">
          <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-alt text-ocean text-2xl" />
          </div>
          <h2 className="font-display text-2xl mb-2">No Rosters Yet</h2>
          <p className="text-ink/60 mb-6">Create your first roster to start scheduling shifts</p>
          <Link
            href="/dashboard/rosters/new"
            className="inline-flex items-center gap-2 bg-ocean text-white px-6 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-colors"
          >
            <i className="fas fa-plus" />
            Create Your First Roster
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/50">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Period</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Shifts</th>
                <th className="text-left p-4 font-semibold">Published</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rosters.map((roster) => (
                <tr key={roster.id} className="border-b border-stone/30 hover:bg-cream/50">
                  <td className="p-4">
                    <p className="font-medium">{roster.name}</p>
                  </td>
                  <td className="p-4 text-ink/60">
                    {new Date(roster.startDate).toLocaleDateString()} - {new Date(roster.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        roster.status === "PUBLISHED"
                          ? "bg-forest/10 text-forest"
                          : roster.status === "DRAFT"
                          ? "bg-gold/10 text-gold"
                          : roster.status === "IN_REVIEW"
                          ? "bg-ocean/10 text-ocean"
                          : "bg-stone/30 text-ink/60"
                      }`}
                    >
                      {roster.status}
                    </span>
                  </td>
                  <td className="p-4 text-ink/60">{roster._count.shifts}</td>
                  <td className="p-4 text-ink/60">
                    {roster.publishedAt ? new Date(roster.publishedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/dashboard/rosters/${roster.id}`}
                      className="text-ocean hover:text-ocean/70 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
