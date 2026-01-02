"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function PasswordSetupModal() {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if we should show the modal
  useEffect(() => {
    if (session?.user && !session.user.hasPassword && !dismissed) {
      // Small delay to let the dashboard load first
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [session, dismissed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set password");
      }

      setSuccess(true);
      // Update the session to reflect password is set
      await update();

      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-forest text-2xl" />
            </div>
            <h2 className="font-display text-2xl mb-2">Password set!</h2>
            <p className="text-ink/60">
              You can now sign in with your email and password.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-lock text-ocean text-2xl" />
              </div>
              <h2 className="font-display text-2xl mb-2">Set your password</h2>
              <p className="text-ink/60">
                Create a password for faster sign-in, or continue using magic links.
              </p>
            </div>

            {error && (
              <div className="bg-terracotta/10 text-terracotta p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
                <i className="fas fa-exclamation-circle mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter password again"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-ink text-cream px-8 py-4 rounded-full font-semibold hover:bg-terracotta transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Setting password...
                  </>
                ) : (
                  <>
                    Set password
                    <i className="fas fa-arrow-right" />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={handleDismiss}
              className="w-full mt-4 text-ink/60 hover:text-ink text-sm font-medium py-2 transition-colors"
            >
              I&apos;ll do this later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
