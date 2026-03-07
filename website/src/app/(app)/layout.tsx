import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { company } from "@/content";
import PasswordSetupModal from "@/components/PasswordSetupModal";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  const s = dict.dashboard.sidebar;
  const navItems = [
    { href: "/dashboard", label: s.dashboard, icon: "fas fa-home" },
    { href: "/dashboard/rosters", label: s.rosters, icon: "fas fa-calendar-alt" },
    { href: "/dashboard/employees", label: s.employees, icon: "fas fa-users" },
    { href: "/dashboard/marketplace", label: s.marketplace, icon: "fas fa-exchange-alt", badge: true },
    { href: "/dashboard/compliance", label: s.compliance, icon: "fas fa-shield-alt" },
    { href: "/dashboard/reports", label: s.reports, icon: "fas fa-chart-bar" },
    { href: "/dashboard/settings", label: s.settings, icon: "fas fa-cog" },
  ];

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <SidebarNav
        items={navItems}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        companyName={company.name}
        toggleSidebarLabel={s.toggleSidebar}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>

      {/* Password setup modal for users without password */}
      <PasswordSetupModal dictionary={dict} />
    </div>
  );
}
