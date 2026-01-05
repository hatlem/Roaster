"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  { href: "/m/schedule", icon: "fa-calendar-alt", label: "Schedule" },
  { href: "/m/clock", icon: "fa-clock", label: "Clock" },
  { href: "/m/shifts", icon: "fa-exchange-alt", label: "Shifts" },
  { href: "/m/time-off", icon: "fa-umbrella-beach", label: "Time Off" },
  { href: "/m/profile", icon: "fa-user", label: "Profile" },
];

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-ink text-cream px-4 py-3 flex items-center justify-between safe-top">
        <Link href="/m" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cream/10 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-cream"
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
          <span className="font-display text-lg">Roaster</span>
        </Link>

        <button className="w-8 h-8 flex items-center justify-center">
          <i className="fas fa-bell text-cream/70" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone/30 safe-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  isActive ? "text-ocean" : "text-ink/50"
                }`}
              >
                <i className={`fas ${item.icon} text-lg`} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* PWA Install Prompt */}
      <style jsx global>{`
        .safe-top {
          padding-top: max(env(safe-area-inset-top), 0.75rem);
        }
        .safe-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 0);
        }
      `}</style>
    </div>
  );
}
