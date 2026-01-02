"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function MagicLinkVerify() {
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
      setError("Invalid magic link - no token provided");
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
        setError("This magic link is invalid or has expired");
      } else {
        setStatus("success");
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch {
      setStatus("error");
      setError("An error occurred while signing in");
    }
  };

  // Verifying state
  if (status === "verifying") {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-3 border-ocean border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="font-display text-2xl mb-2">Verifying magic link...</h1>
        <p className="text-ink/60">Please wait while we sign you in</p>
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
        <h1 className="font-display text-2xl mb-2">Signed in successfully!</h1>
        <p className="text-ink/60">Redirecting to your dashboard...</p>
      </div>
    );
  }

  // Error state
  return (
    <div className="w-full max-w-md mx-auto text-center p-8">
      <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="fas fa-exclamation-triangle text-terracotta text-2xl" />
      </div>
      <h1 className="font-display text-2xl mb-2">Link expired or invalid</h1>
      <p className="text-ink/60 mb-8">{error}</p>

      <div className="space-y-4">
        <Link
          href="/login"
          className="block w-full bg-ink text-cream px-8 py-4 rounded-full font-semibold hover:bg-terracotta transition-colors"
        >
          Back to Login
        </Link>
        <p className="text-ink/60 text-sm">
          Need a new magic link?{" "}
          <Link href="/login" className="text-ocean font-medium hover:underline">
            Request one here
          </Link>
        </p>
      </div>
    </div>
  );
}
