'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LocalizedHeaderProps {
  dictionary: Dictionary;
  locale: Locale;
  country: string;
}

export function LocalizedHeader({ dictionary, locale, country }: LocalizedHeaderProps) {
  const nav = dictionary.nav;
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/features', label: nav.features },
    { href: '/pricing', label: nav.pricing },
    { href: '/industries', label: nav.industries },
    { href: '/customers', label: nav.customers },
    { href: '/about', label: nav.about },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream/95 backdrop-blur-md border-b border-stone/50 shadow-[0_1px_12px_rgba(0,0,0,0.04)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${country}`} className="group">
            <span className="font-display text-2xl font-bold text-ink group-hover:text-terracotta transition-colors duration-300">
              Roaster
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-ink/55 hover:text-ink transition-colors duration-200 group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} />
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium text-ink/55 hover:text-ink transition-colors duration-200"
            >
              {nav.login}
            </Link>
            <Link
              href="/demo"
              className="btn-primary !py-2.5 !px-5 !text-sm !rounded-lg"
            >
              {nav.startTrial}
            </Link>

            {/* Mobile menu button */}
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
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-stone/50 animate-fade-up" style={{ animationDuration: '0.3s' }}>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-ink/70 hover:text-ink hover:bg-stone/30 transition-colors font-medium px-3 py-2.5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-stone/50 my-2" />
              <Link
                href="/login"
                className="text-ink/70 hover:text-ink hover:bg-stone/30 transition-colors font-medium px-3 py-2.5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {nav.login}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
