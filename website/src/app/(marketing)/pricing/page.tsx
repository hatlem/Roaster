import type { Metadata } from "next";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { PricingClient } from "./PricingClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.pricingPage.metaTitle,
    description: dict.pricingPage.metaDescription,
  };
}

export default async function PricingPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return <PricingClient dict={dict} />;
}
