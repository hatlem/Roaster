import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.employees.title };
}

async function getEmployees() {
  try {
    const employees = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { lastName: "asc" },
      take: 50,
    });
    return employees;
  } catch {
    return [];
  }
}

function getRoleBorderColor(role: string) {
  switch (role) {
    case "ADMIN": return "border-l-terracotta";
    case "MANAGER": return "border-l-ocean";
    case "REPRESENTATIVE": return "border-l-gold";
    default: return "border-l-stone";
  }
}

export default async function EmployeesPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.employees;
  const employees = await getEmployees();
  const activeCount = employees.length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="relative overflow-hidden mb-8 animate-fade-up">
        <div className="warm-orb w-[350px] h-[350px] bg-terracotta -top-32 -right-32" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="font-display text-4xl md:text-5xl mb-2">{d.title}</h1>
            <p className="text-ink/60">
              {d.subtitle}
              {activeCount > 0 && (
                <span className="ml-2 text-sm font-medium text-forest bg-forest/10 px-2.5 py-0.5 rounded-full">
                  {activeCount} {d.active.toLowerCase()}
                </span>
              )}
            </p>
          </div>
          <Link
            href="/dashboard/employees/new"
            className="bg-ocean text-white px-6 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
          >
            <i className="fas fa-user-plus" />
            {d.addEmployee}
          </Link>
        </div>
        <div className="accent-line mt-6 animate-line-reveal delay-2" />
      </div>

      {employees.length === 0 ? (
        /* Empty state */
        <div className="relative bg-white rounded-2xl p-16 border border-stone/50 text-center overflow-hidden animate-fade-up delay-2">
          <div className="warm-orb w-[300px] h-[300px] bg-forest top-[-100px] left-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="w-24 h-24 border-2 border-dashed border-forest/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center">
                <i className="fas fa-users text-forest text-2xl" />
              </div>
            </div>
            <h2 className="font-display text-2xl mb-2">{d.noEmployeesTitle}</h2>
            <p className="text-ink/60 mb-8 max-w-md mx-auto">{d.noEmployeesDescription}</p>
            <Link
              href="/dashboard/employees/new"
              className="inline-flex items-center gap-2 bg-ocean text-white px-6 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <i className="fas fa-user-plus" />
              {d.addFirstEmployee}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search input */}
          <div className="animate-fade-up delay-1">
            <div className="relative max-w-sm">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
              <input
                type="text"
                placeholder={`Search ${activeCount} employees...`}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone/50 bg-white font-sans text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean/50 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden card-hover animate-fade-up delay-2">
            <table className="w-full">
              <thead className="bg-cream/80 border-b border-stone/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.name}</th>
                  <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.email}</th>
                  <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.role}</th>
                  <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.department}</th>
                  <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.employeeNumber}</th>
                  <th className="text-right p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.actions}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={`border-b border-stone/20 border-l-4 ${getRoleBorderColor(employee.role)} even:bg-cream/30 hover:bg-cream/60 transition-colors duration-200`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          employee.role === "ADMIN"
                            ? "bg-terracotta/10"
                            : employee.role === "MANAGER"
                            ? "bg-ocean/10"
                            : employee.role === "REPRESENTATIVE"
                            ? "bg-gold/10"
                            : "bg-stone/30"
                        }`}>
                          <span className={`font-semibold text-sm ${
                            employee.role === "ADMIN"
                              ? "text-terracotta"
                              : employee.role === "MANAGER"
                              ? "text-ocean"
                              : employee.role === "REPRESENTATIVE"
                              ? "text-gold"
                              : "text-ink/50"
                          }`}>
                            {(employee.firstName?.[0] || employee.email?.[0] || "?").toUpperCase()}{(employee.lastName?.[0] || "").toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium">{employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.firstName || employee.lastName || employee.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-ink/60 text-sm">{employee.email}</td>
                    <td className="p-4">
                      <span
                        className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                          employee.role === "ADMIN"
                            ? "bg-terracotta/10 text-terracotta"
                            : employee.role === "MANAGER"
                            ? "bg-ocean/10 text-ocean"
                            : employee.role === "REPRESENTATIVE"
                            ? "bg-gold/10 text-gold"
                            : "bg-stone/30 text-ink/60"
                        }`}
                      >
                        {employee.role}
                      </span>
                    </td>
                    <td className="p-4 text-ink/60 text-sm">{employee.department || "-"}</td>
                    <td className="p-4 text-ink/60 text-sm font-mono">{employee.employeeNumber || "-"}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/dashboard/employees/${employee.id}`}
                        className="inline-flex items-center gap-1.5 text-ocean hover:text-ocean/70 font-medium text-sm transition-colors"
                      >
                        {d.view}
                        <i className="fas fa-arrow-right text-xs" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
