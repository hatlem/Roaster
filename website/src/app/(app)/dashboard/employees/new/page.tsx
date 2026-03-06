import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { NewEmployeeForm } from "./new-employee-form";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.employees.newTitle };
}

export default async function NewEmployeePage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return <NewEmployeeForm dictionary={dict.dashboard.employees} />;
}
