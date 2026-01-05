"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full bg-terracotta/10 text-terracotta rounded-xl p-4 font-medium flex items-center justify-center gap-2"
    >
      <i className="fas fa-sign-out-alt" />
      Sign Out
    </button>
  );
}
