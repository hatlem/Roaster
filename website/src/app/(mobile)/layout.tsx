import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { DictionaryProvider } from "@/components/DictionaryProvider";

export default async function MobileRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <DictionaryProvider dictionary={dict} locale={locale}>
      {children}
    </DictionaryProvider>
  );
}
