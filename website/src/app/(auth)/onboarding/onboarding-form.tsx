"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [status, setStatus] = useState<
    "idle" | "creating" | "signing-in" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  // Auto-create account if email param is present
  useEffect(() => {
    if (emailParam && status === "idle") {
      createAccount(emailParam);
    }
  }, [emailParam]);

  const createAccount = async (emailToUse: string) => {
    setStatus("creating");
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setStatus("signing-in");

      // Auto sign-in using magic link token
      const signInResult = await signIn("magic-link", {
        token: data.data.magicLinkToken,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error("Failed to sign in");
      }

      setStatus("success");

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      createAccount(email);
    }
  };

  // Creating account state
  if (status === "creating") {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-3 border-ocean border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="font-display text-2xl mb-2">Creating your account...</h1>
        <p className="text-ink/60">Setting up your organization and workspace</p>
      </div>
    );
  }

  // Signing in state
  if (status === "signing-in") {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="font-display text-2xl mb-2">Signing you in...</h1>
        <p className="text-ink/60">Almost there!</p>
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
        <h1 className="font-display text-2xl mb-2">Welcome to Roaster!</h1>
        <p className="text-ink/60">Redirecting to your dashboard...</p>
      </div>
    );
  }

  // Error state or email form
  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
            <span className="text-cream font-bold text-lg">R</span>
          </div>
          <span className="font-display text-xl">Roaster</span>
        </Link>
        <h1 className="font-display text-3xl mb-2">Start your free trial</h1>
        <p className="text-ink/60">
          14 days free. No credit card required.
        </p>
      </div>

      {error && (
        <div className="bg-terracotta/10 text-terracotta p-4 rounded-xl mb-6 text-sm">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-circle mt-0.5" />
            <div>
              <p className="font-medium">Unable to create account</p>
              <p className="text-terracotta/80">{error}</p>
              {error.includes("already exists") && (
                <Link
                  href="/login"
                  className="text-terracotta underline hover:no-underline mt-2 inline-block"
                >
                  Sign in instead
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2"
          >
            Work email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
          />
        </div>

        <button
          type="submit"
          disabled={!email || status !== "idle" && status !== "error"}
          className="w-full bg-ink text-cream px-8 py-4 rounded-full font-semibold hover:bg-terracotta transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start free trial
          <i className="fas fa-arrow-right" />
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-stone/30 text-center">
        <p className="text-ink/60 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-ocean font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 text-center">
        <div className="bg-cream/50 rounded-xl p-4">
          <i className="fas fa-shield-alt text-forest text-xl mb-2" />
          <p className="text-xs text-ink/60">Full compliance</p>
        </div>
        <div className="bg-cream/50 rounded-xl p-4">
          <i className="fas fa-credit-card text-ocean text-xl mb-2" />
          <p className="text-xs text-ink/60">No credit card</p>
        </div>
      </div>

      <p className="text-center text-xs text-ink/40 mt-6">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-ink/60">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-ink/60">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
