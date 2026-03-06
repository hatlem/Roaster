import { getServerLocale } from '@/i18n/server';
import { getDictionary } from '@/i18n/dictionaries';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  const dictionary = getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col">
      <Header dictionary={dictionary} />
      <main className="flex-1">{children}</main>
      <Footer dictionary={dictionary} />
    </div>
  );
}
