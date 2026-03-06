import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getEmployee(id: string) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id },
      include: {
        location: true,
      },
    });
    return employee;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const employee = await getEmployee(id);
  return {
    title: employee ? `${employee.firstName} ${employee.lastName}` : dict.dashboard.employees.employeeNotFound,
  };
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const d = dict.dashboard.employees;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/employees"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          {d.backToEmployees}
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center">
            <span className="text-ocean font-semibold text-xl">
              {employee.firstName[0]}{employee.lastName[0]}
            </span>
          </div>
          <div>
            <h1 className="font-display text-4xl mb-1">{employee.firstName} {employee.lastName}</h1>
            <p className="text-ink/60">{employee.position || employee.role}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone/50">
            <h2 className="font-display text-xl mb-4">{d.personalInformation}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.email}</p>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.phone}</p>
                <p className="font-medium">{employee.phoneNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.employeeNumber}</p>
                <p className="font-medium">{employee.employeeNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.hireDate}</p>
                <p className="font-medium">
                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString("en-GB") : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone/50">
            <h2 className="font-display text-xl mb-4">{d.employmentDetails}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.role}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  employee.role === "ADMIN"
                    ? "bg-terracotta/10 text-terracotta"
                    : employee.role === "MANAGER"
                    ? "bg-ocean/10 text-ocean"
                    : employee.role === "REPRESENTATIVE"
                    ? "bg-gold/10 text-gold"
                    : "bg-stone/30 text-ink/60"
                }`}>
                  {employee.role}
                </span>
              </div>
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.department}</p>
                <p className="font-medium">{employee.department || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.position}</p>
                <p className="font-medium">{employee.position || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.location}</p>
                <p className="font-medium">{employee.location?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.hourlyRate}</p>
                <p className="font-medium">
                  {employee.hourlyRate ? `${employee.hourlyRate} kr/h` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-ink/60 mb-1">{d.status}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  employee.isActive ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"
                }`}>
                  {employee.isActive ? d.active : d.inactive}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone/50">
            <h2 className="font-display text-xl mb-4">{d.upcomingShifts}</h2>
            <div className="text-center py-8 text-ink/60">
              <i className="fas fa-calendar-alt text-4xl mb-4 text-stone" />
              <p>{d.noUpcomingShifts}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone/50">
            <h2 className="font-display text-xl mb-4">{d.quickStats}</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-ink/60">{d.hoursThisWeek}</span>
                <span className="font-semibold">0h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">{d.hoursThisMonth}</span>
                <span className="font-semibold">0h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">{d.overtimeYTD}</span>
                <span className="font-semibold text-forest">0h</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone/50">
            <h2 className="font-display text-xl mb-4">{d.actionsTitle}</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-cream text-ink/80 flex items-center gap-3">
                <i className="fas fa-edit text-ocean" />
                {d.editEmployee}
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-cream text-ink/80 flex items-center gap-3">
                <i className="fas fa-calendar-plus text-forest" />
                {d.assignShift}
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-cream text-ink/80 flex items-center gap-3">
                <i className="fas fa-file-alt text-gold" />
                {d.viewReports}
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-terracotta/10 text-terracotta flex items-center gap-3">
                <i className="fas fa-user-times" />
                {d.deactivate}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
