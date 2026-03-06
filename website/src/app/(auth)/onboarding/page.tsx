import { Suspense } from "react";
import OnboardingForm from "./onboarding-form";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.auth.onboarding.metaTitle,
    description: dict.auth.onboarding.metaDescription,
  };
}

function OnboardingFormSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="animate-pulse">
        <div className="h-8 bg-stone/30 rounded w-3/4 mb-4" />
        <div className="h-4 bg-stone/30 rounded w-full mb-8" />
        <div className="h-12 bg-stone/30 rounded-xl mb-4" />
        <div className="h-12 bg-stone/30 rounded-xl" />
      </div>
    </div>
  );
}

export default async function OnboardingPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<OnboardingFormSkeleton />}>
      <OnboardingForm dictionary={dict} />
    </Suspense>
  );
}
