import { Suspense } from "react";
import MagicLinkVerify from "./magic-link-verify";

export const metadata = {
  title: "Sign In",
};

function VerifyingSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto text-center p-8">
      <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="w-8 h-8 border-3 border-ocean border-t-transparent rounded-full animate-spin" />
      </div>
      <h1 className="font-display text-2xl mb-2">Verifying...</h1>
      <p className="text-ink/60">Please wait while we sign you in</p>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<VerifyingSkeleton />}>
      <MagicLinkVerify />
    </Suspense>
  );
}
