import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { NewRosterForm } from "./new-roster-form";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.dashboard.rosters.newTitle };
}

export default async function NewRosterPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return <NewRosterForm dictionary={dict.dashboard.rosters} />;
}
