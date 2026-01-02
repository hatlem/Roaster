"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EmailCaptureFormProps {
  variant?: "light" | "dark";
  buttonText?: string;
  placeholder?: string;
  className?: string;
}

export default function EmailCaptureForm({
  variant = "light",
  buttonText = "Start free trial",
  placeholder = "Enter your work email",
  className = "",
}: EmailCaptureFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitting(true);
      router.push(`/onboarding?email=${encodeURIComponent(email)}`);
    }
  };

  const isLight = variant === "light";

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        className={`flex-1 px-5 py-4 rounded-full text-base focus:outline-none focus:ring-2 ${
          isLight
            ? "bg-white border border-stone text-ink placeholder:text-ink/40 focus:ring-ocean/20 focus:border-ocean"
            : "bg-white/10 border border-white/20 text-cream placeholder:text-cream/50 focus:ring-cream/20 focus:border-cream/50"
        }`}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-8 py-4 rounded-full font-semibold transition-all inline-flex items-center justify-center gap-2 group whitespace-nowrap disabled:opacity-70 ${
          isLight
            ? "bg-ink text-cream hover:bg-terracotta"
            : "bg-cream text-ink hover:bg-cream/90 hover:scale-105"
        }`}
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {buttonText}
            <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}
