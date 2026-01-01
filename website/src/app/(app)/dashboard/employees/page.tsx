import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Employees",
};

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

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-2">Employees</h1>
          <p className="text-ink/60">Manage your team members</p>
        </div>
        <Link
          href="/dashboard/employees/new"
          className="bg-ocean text-white px-6 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-user-plus" />
          Add Employee
        </Link>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone/50 text-center">
          <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users text-forest text-2xl" />
          </div>
          <h2 className="font-display text-2xl mb-2">No Employees Yet</h2>
          <p className="text-ink/60 mb-6">Add your first employee to start building your team</p>
          <Link
            href="/dashboard/employees/new"
            className="inline-flex items-center gap-2 bg-ocean text-white px-6 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-colors"
          >
            <i className="fas fa-user-plus" />
            Add Your First Employee
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/50">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Email</th>
                <th className="text-left p-4 font-semibold">Role</th>
                <th className="text-left p-4 font-semibold">Department</th>
                <th className="text-left p-4 font-semibold">Employee #</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-stone/30 hover:bg-cream/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-ocean/10 rounded-full flex items-center justify-center">
                        <span className="text-ocean font-semibold">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                    </div>
                  </td>
                  <td className="p-4 text-ink/60">{employee.email}</td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
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
                  <td className="p-4 text-ink/60">{employee.department || "-"}</td>
                  <td className="p-4 text-ink/60">{employee.employeeNumber || "-"}</td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/dashboard/employees/${employee.id}`}
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
