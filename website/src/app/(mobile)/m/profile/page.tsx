import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { SignOutButton } from "@/components/mobile/SignOutButton";

export const dynamic = "force-dynamic";

async function getUserProfile(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organization: { select: { name: true } },
        location: { select: { name: true } },
      },
    });
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getUserProfile(session.user.id);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl">Profile</h1>
        <p className="text-ink/60 text-sm">Manage your account</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone/30 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-display text-ocean">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-display">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-ink/60 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-building w-5 text-ink/40" />
            <div>
              <p className="text-xs text-ink/60">Organization</p>
              <p className="font-medium">
                {user.organization?.name || "Not assigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <i className="fas fa-map-marker-alt w-5 text-ink/40" />
            <div>
              <p className="text-xs text-ink/60">Location</p>
              <p className="font-medium">
                {user.location?.name || "Not assigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <i className="fas fa-user-tag w-5 text-ink/40" />
            <div>
              <p className="text-xs text-ink/60">Role</p>
              <p className="font-medium capitalize">
                {user.role?.toLowerCase().replace("_", " ") || "Employee"}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Settings Links */}
      <div className="bg-white rounded-xl border border-stone/30 divide-y divide-stone/20">
        <Link
          href="/m/profile/notifications"
          className="flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-bell w-5 text-ink/60" />
            <span>Notifications</span>
          </div>
          <i className="fas fa-chevron-right text-ink/40" />
        </Link>

        <Link
          href="/m/profile/preferences"
          className="flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-sliders-h w-5 text-ink/60" />
            <span>Preferences</span>
          </div>
          <i className="fas fa-chevron-right text-ink/40" />
        </Link>

        <Link
          href="/m/profile/availability"
          className="flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-calendar-check w-5 text-ink/60" />
            <span>Availability</span>
          </div>
          <i className="fas fa-chevron-right text-ink/40" />
        </Link>
      </div>

      {/* Help & Support */}
      <div className="mt-6 bg-white rounded-xl border border-stone/30 divide-y divide-stone/20">
        <Link
          href="/help"
          className="flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-question-circle w-5 text-ink/60" />
            <span>Help & Support</span>
          </div>
          <i className="fas fa-chevron-right text-ink/40" />
        </Link>

        <Link
          href="/privacy"
          className="flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-shield-alt w-5 text-ink/60" />
            <span>Privacy Policy</span>
          </div>
          <i className="fas fa-chevron-right text-ink/40" />
        </Link>
      </div>

      {/* Sign Out */}
      <div className="mt-6">
        <SignOutButton />
      </div>

      {/* App Version */}
      <p className="text-center text-xs text-ink/40 mt-6">
        Roaster v1.0.0
      </p>
    </div>
  );
}
