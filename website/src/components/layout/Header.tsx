"use client";

import Link from "next/link";
import { useState } from "react";
import { company, navigation } from "@/content";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-lg border-b border-stone">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-cream" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-2xl font-display font-medium">{company.name}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-ink/70 hover:text-ink transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-ink/70 hover:text-ink transition-colors font-medium"
            >
              Log in
            </Link>
            <Link href={navigation.cta.primary.href} className="btn-primary">
              {navigation.cta.primary.name}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-stone">
            <div className="flex flex-col gap-4">
              {navigation.main.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-ink/70 hover:text-ink transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <hr className="border-stone" />
              <Link
                href="/login"
                className="text-ink/70 hover:text-ink transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href={navigation.cta.primary.href}
                className="btn-primary text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {navigation.cta.primary.name}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
