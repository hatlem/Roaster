import { Suspense } from "react";
import OnboardingForm from "./onboarding-form";

export const metadata = {
  title: "Get Started",
  description: "Create your Roaster account and start your free trial.",
};

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

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFormSkeleton />}>
      <OnboardingForm />
    </Suspense>
  );
}
