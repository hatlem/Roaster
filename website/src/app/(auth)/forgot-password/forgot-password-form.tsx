"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  dictionary: Dictionary;
};

export default function ForgotPasswordForm({ dictionary }: Props) {
  const t = dictionary.auth.forgotPassword;
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setError(t.failedToSend);
      }
    } catch {
      setError(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 border border-stone/50 text-center">
            <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-envelope-open-text text-forest text-2xl" />
            </div>
            <h1 className="font-display text-2xl mb-2">{t.submitted.title}</h1>
            <p className="text-ink/60 mb-6">
              {t.submitted.description.replace('{email}', email)}
            </p>
            <Link
              href="/login"
              className="text-ocean hover:text-ocean/70 font-medium"
            >
              {t.submitted.returnToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-display text-3xl text-ocean">Roaster</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-stone/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-key text-ocean text-2xl" />
            </div>
            <h1 className="font-display text-2xl mb-2">{t.title}</h1>
            <p className="text-ink/60">
              {t.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-terracotta/10 text-terracotta px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ocean text-white py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  {t.sending}
                </>
              ) : (
                t.sendResetLink
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-ocean hover:text-ocean/70 font-medium flex items-center justify-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              {t.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
