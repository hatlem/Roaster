import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { EditEmployeeForm } from "./edit-employee-form";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getEmployee(id: string, organizationId: string) {
  try {
    const employee = await prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        department: true,
        position: true,
        employeeNumber: true,
        hourlyRate: true,
      },
    });
    return employee;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as { organizationId?: string })?.organizationId;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const employee = organizationId ? await getEmployee(id, organizationId) : null;
  return {
    title: employee
      ? `${dict.dashboard.employees.editTitle} - ${employee.firstName} ${employee.lastName}`
      : dict.dashboard.employees.employeeNotFound,
  };
}

export default async function EditEmployeePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as { organizationId?: string })?.organizationId;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const employee = organizationId ? await getEmployee(id, organizationId) : null;

  if (!employee) {
    notFound();
  }

  // Serialize hourlyRate (Decimal) to string for the client component
  const serializedEmployee = {
    ...employee,
    hourlyRate: employee.hourlyRate ? String(employee.hourlyRate) : "",
  };

  return (
    <EditEmployeeForm
      employee={serializedEmployee}
      dictionary={dict.dashboard.employees}
    />
  );
}
