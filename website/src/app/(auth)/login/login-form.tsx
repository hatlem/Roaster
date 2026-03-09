"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { company } from "@/content";
import type { Dictionary } from "@/i18n/dictionaries";

type LoginMode = "password" | "magic-link";

type Props = {
  dictionary: Dictionary;
};

export default function LoginForm({ dictionary }: Props) {
  const t = dictionary.auth.login;
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t.invalidCredentials);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.failedSendMagicLink);
      }

      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
  };

  // Magic link sent success state
  if (magicLinkSent) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone/50 text-center">
          <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-envelope text-ocean text-2xl" />
          </div>
          <h1 className="font-display text-2xl mb-2">{t.magicLinkSent.title}</h1>
          <p className="text-ink/60 mb-6">
            {t.magicLinkSent.sentTo} <strong className="text-ink">{email}</strong>
          </p>
          <p className="text-sm text-ink/50 mb-8">
            {t.magicLinkSent.clickLink}
          </p>
          <button
            onClick={() => {
              setMagicLinkSent(false);
              setEmail("");
            }}
            className="text-ocean hover:underline font-medium text-sm"
          >
            {t.magicLinkSent.useDifferentEmail}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone/50">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl mb-2">{t.welcomeBack}</h1>
          <p className="text-ink/60">{t.signInTo.replace('{companyName}', company.name)}</p>
        </div>

        {/* Toggle */}
        <div className="flex p-1 bg-stone/30 rounded-full mb-8">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError("");
            }}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              mode === "password"
                ? "bg-white text-ink shadow-sm"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            {t.passwordTab}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("magic-link");
              setError("");
            }}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              mode === "magic-link"
                ? "bg-white text-ink shadow-sm"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            {t.magicLinkTab}
          </button>
        </div>

        {error && (
          <div className="bg-terracotta/10 text-terracotta p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
            <i className="fas fa-exclamation-circle mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t.emailLabel}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                placeholder={t.emailPlaceholder}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                placeholder={t.passwordPlaceholder}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-stone" />
                <span className="text-ink/60">{t.rememberMe}</span>
              </label>
              <Link href="/forgot-password" className="text-ocean hover:underline">
                {t.forgotPassword}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t.signingIn}
                </>
              ) : (
                t.signIn
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-6">
            <div>
              <label htmlFor="magic-email" className="block text-sm font-medium mb-2">
                {t.emailLabel}
              </label>
              <input
                type="email"
                id="magic-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                placeholder={t.emailPlaceholder}
              />
            </div>

            <p className="text-sm text-ink/50">
              {t.magicLinkDescription}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  {t.sendMagicLink}
                  <i className="fas fa-paper-plane ml-2" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-ink/60">
          {t.noAccount}{" "}
          <Link href="/onboarding" className="text-ocean hover:underline font-medium">
            {t.startFreeTrial}
          </Link>
        </div>
      </div>
    </div>
  );
}
