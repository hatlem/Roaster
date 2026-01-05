import Link from "next/link";
import { company } from "@/content";
import PasswordSetupModal from "@/components/PasswordSetupModal";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-cream flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cream/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-cream" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-display font-medium">{company.name}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <i className="fas fa-home w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/rosters"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <i className="fas fa-calendar-alt w-5" />
                Rosters
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/employees"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <i className="fas fa-users w-5" />
                Employees
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/marketplace"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <i className="fas fa-exchange-alt w-5" />
                Marketplace
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/compliance"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <i className="fas fa-shield-alt w-5" />
                Compliance
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/reports"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <i className="fas fa-chart-bar w-5" />
                Reports
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <i className="fas fa-cog w-5" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-cream/60"
          >
            <i className="fas fa-sign-out-alt w-5" />
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Password setup modal for users without password */}
      <PasswordSetupModal />
    </div>
  );
}
