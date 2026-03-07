"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: boolean;
}

interface SidebarNavProps {
  items: NavItem[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  companyName: string;
  toggleSidebarLabel?: string;
}

export function SidebarNav({ items, user, companyName, toggleSidebarLabel = "Toggle sidebar" }: SidebarNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "?";

  const sidebarContent = (
    <>
      {/* Warm gradient accent bar */}
      <div className="h-[2px] bg-gradient-to-r from-terracotta via-gold to-terracotta/0" />

      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-terracotta/20 to-gold/10 rounded-xl flex items-center justify-center border border-white/[0.06] transition-all duration-300 group-hover:from-terracotta/30 group-hover:to-gold/20">
            <svg
              className="w-5 h-5 text-terracotta"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-xl font-display font-medium text-cream/90 group-hover:text-cream transition-colors duration-300">
            {companyName}
          </span>
        </Link>
      </div>

      {/* Terracotta accent line under logo */}
      <div className="mx-6 h-px bg-gradient-to-r from-terracotta/30 via-gold/20 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-white/[0.08] text-cream"
                      : "text-cream/50 hover:bg-white/[0.04] hover:text-cream/80"
                  }`}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-terracotta to-gold rounded-full" />
                  )}
                  <i
                    className={`${item.icon} w-5 text-center text-sm transition-colors duration-200 ${
                      active
                        ? "text-terracotta"
                        : "text-cream/40 group-hover:text-cream/60"
                    }`}
                  />
                  <span className="font-medium text-[0.9375rem]">
                    {item.label}
                  </span>
                  {/* Badge dot */}
                  {item.badge && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-terracotta animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/[0.06]">
        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/[0.08]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta/30 to-gold/20 flex items-center justify-center ring-2 ring-white/[0.08]">
              <span className="text-xs font-semibold text-cream/80">
                {initials}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {user.name && (
              <p className="text-sm font-medium text-cream/80 truncate">
                {user.name}
              </p>
            )}
            {user.email && (
              <p className="text-xs text-cream/40 truncate">{user.email}</p>
            )}
          </div>
        </div>

        {/* Sign out */}
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-cream/40 hover:bg-white/[0.04] hover:text-cream/60 transition-all duration-200"
        >
          <i className="fas fa-sign-out-alt w-5 text-center text-sm" />
          <span className="text-[0.9375rem]">Sign out</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-warm-dark/90 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-cream/70 hover:text-cream transition-colors duration-200"
        aria-label={toggleSidebarLabel}
      >
        <i className={`fas ${mobileOpen ? "fa-times" : "fa-bars"} text-sm`} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-warm-dark text-cream flex-col relative grain shrink-0 overflow-hidden">
        {/* Subtle warm orb glow */}
        <div className="warm-orb w-32 h-32 bg-terracotta/40 -top-8 -right-8" />
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-warm-dark text-cream flex flex-col z-40 grain overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Subtle warm orb glow */}
        <div className="warm-orb w-32 h-32 bg-terracotta/40 -top-8 -right-8" />
        {sidebarContent}
      </aside>
    </>
  );
}
