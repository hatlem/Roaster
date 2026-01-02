"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { company } from "@/content";

type LoginMode = "password" | "magic-link";

export default function LoginForm() {
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
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("An error occurred. Please try again.");
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
        throw new Error(data.error || "Failed to send magic link");
      }

      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
          <h1 className="font-display text-2xl mb-2">Check your email</h1>
          <p className="text-ink/60 mb-6">
            We sent a magic link to <strong className="text-ink">{email}</strong>
          </p>
          <p className="text-sm text-ink/50 mb-8">
            Click the link in the email to sign in. The link expires in 1 hour.
          </p>
          <button
            onClick={() => {
              setMagicLinkSent(false);
              setEmail("");
            }}
            className="text-ocean hover:underline font-medium text-sm"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone/50">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl mb-2">Welcome back</h1>
          <p className="text-ink/60">Sign in to your {company.name} account</p>
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
            Password
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
            Magic link
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
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                placeholder="you@company.no"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-stone" />
                <span className="text-ink/60">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-ocean hover:underline">
                Forgot password?
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
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-6">
            <div>
              <label htmlFor="magic-email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="magic-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                placeholder="you@company.no"
              />
            </div>

            <p className="text-sm text-ink/50">
              We&apos;ll send you a magic link to sign in without a password.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send magic link
                  <i className="fas fa-paper-plane ml-2" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-ink/60">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" className="text-ocean hover:underline font-medium">
            Start free trial
          </Link>
        </div>
      </div>
    </div>
  );
}
