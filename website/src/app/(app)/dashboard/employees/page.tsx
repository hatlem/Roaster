import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { EmployeeTable } from "@/components/dashboard/EmployeeTable";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.employees.title };
}

async function getEmployees(organizationId: string) {
  try {
    const employees = await prisma.user.findMany({
      where: { isActive: true, organizationId },
      orderBy: { lastName: "asc" },
      take: 50,
    });
    return employees;
  } catch {
    return [];
  }
}

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as { organizationId?: string })?.organizationId;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.employees;
  const employees = organizationId ? await getEmployees(organizationId) : [];
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
        <EmployeeTable
          employees={employees.map((e) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            email: e.email,
            role: e.role,
            department: e.department,
            employeeNumber: e.employeeNumber,
          }))}
          dictionary={d}
          locale={locale}
        />
      )}
    </div>
  );
}
