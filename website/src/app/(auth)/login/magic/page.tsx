import { Suspense } from "react";
import MagicLinkVerify from "./magic-link-verify";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.auth.magicLink.metaTitle };
}

export default async function MagicLinkPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <Suspense fallback={<VerifyingSkeleton dictionary={dict} />}>
      <MagicLinkVerify dictionary={dict} />
    </Suspense>
  );
}

function VerifyingSkeleton({ dictionary }: { dictionary: { auth: { magicLink: { verifying: string; pleaseWait: string } } } }) {
  return (
    <div className="w-full max-w-md mx-auto text-center p-8">
      <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="w-8 h-8 border-3 border-ocean border-t-transparent rounded-full animate-spin" />
      </div>
      <h1 className="font-display text-2xl mb-2">{dictionary.auth.magicLink.verifying}</h1>
      <p className="text-ink/60">{dictionary.auth.magicLink.pleaseWait}</p>
    </div>
  );
}
