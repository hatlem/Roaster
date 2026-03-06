"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  dictionary: Dictionary;
};

export default function MagicLinkVerify({ dictionary }: Props) {
  const t = dictionary.auth.magicLink;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError(t.invalidTokenError);
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const result = await signIn("magic-link", {
        token: tokenToVerify,
        redirect: false,
      });

      if (result?.error) {
        setStatus("error");
        setError(t.expiredTokenError);
      } else {
        setStatus("success");
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch {
      setStatus("error");
      setError(t.signingInError);
    }
  };

  // Verifying state
  if (status === "verifying") {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-3 border-ocean border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="font-display text-2xl mb-2">{t.verifyingMagicLink}</h1>
        <p className="text-ink/60">{t.pleaseWait}</p>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-check text-forest text-2xl" />
        </div>
        <h1 className="font-display text-2xl mb-2">{t.signedInSuccessfully}</h1>
        <p className="text-ink/60">{t.redirecting}</p>
      </div>
    );
  }

  // Error state
  return (
    <div className="w-full max-w-md mx-auto text-center p-8">
      <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="fas fa-exclamation-triangle text-terracotta text-2xl" />
      </div>
      <h1 className="font-display text-2xl mb-2">{t.linkExpiredOrInvalid}</h1>
      <p className="text-ink/60 mb-8">{error}</p>

      <div className="space-y-4">
        <Link
          href="/login"
          className="block w-full bg-ink text-cream px-8 py-4 rounded-full font-semibold hover:bg-terracotta transition-colors"
        >
          {t.backToLogin}
        </Link>
        <p className="text-ink/60 text-sm">
          {t.needNewLink}{" "}
          <Link href="/login" className="text-ocean font-medium hover:underline">
            {t.requestOneHere}
          </Link>
        </p>
      </div>
    </div>
  );
}
