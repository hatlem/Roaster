"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { company } from "@/content";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone/50">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl mb-2">Welcome back</h1>
          <p className="text-ink/60">Sign in to your {company.name} account</p>
        </div>

        {error && (
          <div className="bg-terracotta/10 text-terracotta p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-ink/60">
          Don&apos;t have an account?{" "}
          <Link href="/demo" className="text-ocean hover:underline font-medium">
            Start free trial
          </Link>
        </div>
      </div>
    </div>
  );
}
