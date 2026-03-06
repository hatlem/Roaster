"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

interface HeaderProps {
  dictionary: Dictionary;
}

export function Header({ dictionary }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/features", label: dictionary.nav.features },
    { href: "/pricing", label: dictionary.nav.pricing },
    { href: "/about", label: dictionary.nav.about },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-md border-b border-stone/60 shadow-[0_1px_12px_rgba(0,0,0,0.04)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-xl font-display font-medium tracking-tight group-hover:text-terracotta transition-colors duration-300">
              Roaster
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-ink/60 hover:text-ink transition-colors duration-200 font-medium text-[0.9375rem] group"
              >
                {item.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/login"
              className="text-ink/60 hover:text-ink transition-colors duration-200 font-medium text-[0.9375rem]"
            >
              {dictionary.common.logIn}
            </Link>
            <Link href="/onboarding" className="btn-primary !py-2.5 !px-5 !text-sm">
              {dictionary.common.startFreeTrial}
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-stone/30 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-stone/50 animate-fade-up" style={{ animationDuration: "0.3s" }}>
            <div className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-ink/70 hover:text-ink hover:bg-stone/30 transition-colors font-medium px-3 py-2.5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="border-stone/50 my-2" />
              <Link
                href="/login"
                className="text-ink/70 hover:text-ink hover:bg-stone/30 transition-colors font-medium px-3 py-2.5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {dictionary.common.logIn}
              </Link>
              <div className="mt-2 px-3">
                <Link
                  href="/onboarding"
                  className="btn-primary text-center w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {dictionary.common.startFreeTrial}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
